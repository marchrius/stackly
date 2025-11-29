<?php

declare(strict_types=1);

namespace App\Model\Scraper;

use App\Entity\Path;
use App\Entity\Scraper;
use App\Enum\ScraperTypeEnum;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\Validator\Constraints as Assert;

class Header
{
    #[Assert\NotBlank]
    private ?string $header = null;

    #[Assert\NotBlank]
    private ?string $value = null;

    public function getHeader(): ?string
    {
        return $this->header;
    }

    public function setHeader(?string $header): Header
    {
        $this->header = $header;

        return $this;
    }

    public function getValue(): ?string
    {
        return $this->value;
    }

    public function setValue(?string $value): Header
    {
        $this->value = $value;

        return $this;
    }
}
