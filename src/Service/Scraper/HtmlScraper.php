<?php

declare(strict_types=1);

namespace App\Service\Scraper;

use App\Entity\Datum;
use App\Enum\DatumTypeEnum;
use App\Enum\VisibilityEnum;
use App\Model\ScrapingCollection;
use App\Model\ScrapingItem;
use App\Model\ScrapingWish;
use Symfony\Component\DomCrawler\Crawler;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Intl\Countries;
use Symfony\Component\Panther\Client as PantherClient;
use Twig\Environment;

abstract class HtmlScraper
{
    public function __construct(
        protected Environment $twig
    ) {
    }

    protected function getCrawler(ScrapingItem|ScrapingCollection|ScrapingWish $scraping): Crawler
    {
        if ($scraping->getFile() instanceof UploadedFile) {
            return new Crawler($scraping->getFile()->getContent());
        }

        $pantherClient = PantherClient::createChromeClient(null, [
            '--headless',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1200,1100',
        ], ['port' => random_int(9515, 9999)]);

        try {
            $pantherClient->request('GET', $scraping->getUrl());

            // Poll until the DOM stops changing — required for SPAs (Next.js RSC, React, etc.)
            // getPageSource() called immediately after request() captures pre-hydration HTML
            $html = '';
            $previousHtml = null;
            $deadline = time() + 10;
            do {
                usleep(500_000);
                $html = $pantherClient->executeScript('return document.documentElement.outerHTML');
                if ($html === $previousHtml) {
                    break;
                }
                $previousHtml = $html;
            } while (time() < $deadline);
        } finally {
            $pantherClient->quit();
        }

        // Strip non-visible elements so XPath cannot match RSC payloads, React hydration
        // templates, or inline scripts — PHP's DOMDocument does not honour HTML5 semantics
        // for <script> and <template> and would otherwise include their content in the tree.
        $html = preg_replace('@<(script|template|noscript)[^>]*>.*?</\1>@si', '', $html);

        return new Crawler($html);
    }

    protected function extract(?string $template, string $type, Crawler $crawler, $scraping): ?string
    {
        if (!$template) {
            return '';
        }

        $values = [];
        preg_match_all('/#(.*?)#/', $template, $matches);

        foreach ($matches[1] as $xPath) {
            $results = $crawler->evaluate($xPath);

            if ($results instanceof Crawler) {
                $results = $results->each(static function (Crawler $node): string {
                    $domNode = $node->getNode(0);
                    if ($domNode instanceof \DOMAttr) {
                        return $domNode->value;
                    }

                    return $node->text();
                });
            }



            foreach ($results as $key => $result) {
                if (isset($values[$key])) {
                    $values[$key] = str_replace("#{$xPath}#", $result, $values[$key]);
                } else {
                    $values[$key] = str_replace("#{$xPath}#", $result, $template);
                }
            }

            // Remove xPath from result in case nothing was found
            foreach ($values as &$value) {
                $value = str_replace("#{$xPath}#", '', $value);
            }
        }

        return $this->formatValues($values, $type, $scraping);
    }

    protected function scrapData(ScrapingItem|ScrapingCollection|ScrapingWish $scraping, Crawler $crawler, string $entityType): array
    {
        $data = [];

        foreach ($scraping->getDataToScrap() as $key => $dataToScrap) {
            $value = $this->extract($dataToScrap->getPath(), $dataToScrap->getType(), $crawler, $scraping);

            $datum = (new Datum())
                ->setValue($value)
                ->setLabel($dataToScrap->getName())
                ->setType($dataToScrap->getType())
                ->setPosition((int) $key)
            ;

            $data[] = [
                $dataToScrap->getType(),
                $dataToScrap->getName(),
                $this->twig->render('App/Datum/_datum.html.twig', [
                    'entity' => $entityType,
                    'iteration' => '__placeholder__',
                    'type' => $dataToScrap->getType(),
                    'datum' => $datum,
                    'label' => $datum->getLabel(),
                    'choiceList' => $datum->getChoiceList(),
                    'visibility' => $datum->getVisibility()
                ])
            ];
        }

        return $data;
    }

    protected function formatValues(?array $values, string $type, $scraping): ?string
    {
        if ($values === null || $values === []) {
            return null;
        }

        if ($type === DatumTypeEnum::TYPE_TEXT) {
            return implode(', ', array_unique($values));
        }

        if ($type === DatumTypeEnum::TYPE_LIST) {
            return json_encode(array_values(array_unique($values)));
        }

        if ($type === DatumTypeEnum::TYPE_TEXTAREA) {
            return $values[0];
        }

        if ($type === DatumTypeEnum::TYPE_COUNTRY) {
            $value = array_shift($values);

            // Try to match alpha2 code
            if (\strlen($value) === 2 && Countries::exists(strtoupper($value))) {
                return strtoupper($value);
            }

            // Try to match alpha3 code
            if (\strlen($value) === 3 && Countries::alpha3CodeExists(strtoupper($value))) {
                return strtoupper($value);
            }

            // Else try to match the country name
            return array_flip(Countries::getNames())[$value] ?? null;
        }

        if ($type === DatumTypeEnum::TYPE_IMAGE) {
            return $this->guessHost($values[0], $scraping);
        }

        if ($type === DatumTypeEnum::TYPE_LINK) {
            return $this->guessHost($values[0], $scraping);
        }

        return null;
    }

    protected function guessHost(?string $url, ScrapingItem|ScrapingCollection|ScrapingWish $scraping): ?string
    {
        if ($url === null || $scraping->getUrl() === null) {
            return null;
        }

        $urlElements = parse_url($url);
        if (!isset($urlElements['host'])) {
            $scrapingUrlElements = parse_url($scraping->getUrl());
            $url = $scrapingUrlElements['scheme'] . '://' . $scrapingUrlElements['host'] . ($urlElements['path'] ?? '');
            if (isset($urlElements['query'])) {
                $url .= '?' . $urlElements['query'];
            }
        }

        return $url;
    }
}
