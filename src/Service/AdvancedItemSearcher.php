<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Collection;
use App\Entity\Interfaces\BreadcrumbableInterface;
use App\Entity\Item;
use App\Entity\Scraper;
use App\Entity\Search;
use App\Entity\Tag;
use App\Entity\User;
use App\Enum\AdvancedItemSearch\ConditionEnum;
use App\Enum\AdvancedItemSearch\OperatorEnum;
use App\Enum\AdvancedItemSearch\TypeEnum;
use App\Enum\DatumTypeEnum;
use App\Enum\ScraperTypeEnum;
use App\Model\BreadcrumbElement;
use App\Repository\ItemRepository;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bridge\Doctrine\ManagerRegistry;

class AdvancedItemSearcher
{
    public function __construct(private readonly ItemRepository $itemRepository)
    {
    }

    public function search(Search $search): array
    {
        $qb = $this->itemRepository
            ->createQueryBuilder('item')
            ->leftJoin('item.data', 'datum')
        ;

        foreach ($search->getBlocks() as $block) {
            $blockParts = [];
            foreach ($block->getFilters() as $filter) {
                $filterParts = [];
                if ($filter->getCondition()) {
                    $filterParts[] = $filter->getCondition();
                }

                $filterParts[] = match ($filter->getType()) {
                    TypeEnum::TYPE_NAME => $this->buildNameFilter($qb, $filter->getOperator(), $filter->getValue()),
                    TypeEnum::TYPE_DATUM => $this->buildDatumFilter($qb, $filter->getOperator(), $filter->getValue(), $filter->getDatumLabel(), $filter->getDatumType()),
                };

                $blockParts[] = implode(' ', $filterParts);
            }

            $blockSql = implode(' ', $blockParts);

            if (empty($blockSql)) {
                continue;
            }

            match ($block->getCondition()) {
                ConditionEnum::CONDITION_AND => $qb->andWhere($blockSql),
                ConditionEnum::CONDITION_OR => $qb->orWhere($blockSql),
            };
        }

        return $qb->getQuery()->getResult();
    }

    private function buildNameFilter(QueryBuilder $queryBuilder, string $operator, string $value): string
    {
        $paramValue = uniqid('name_value_');

        if ($operator === OperatorEnum::OPERATOR_EQUAL) {
            $queryBuilder->setParameter($paramValue, $value);
            return "LOWER(item.name) = LOWER(:{$paramValue})";
        }

        if ($operator === OperatorEnum::OPERATOR_CONTAINS) {
            $queryBuilder->setParameter($paramValue, "%{$value}%");
            return "LOWER(item.name) LIKE LOWER(:{$paramValue})";
        }

        return '';
    }

    private function buildDatumFilter(QueryBuilder $queryBuilder, string $operator, string $value, string $datumLabel, string $datumType): string
    {
        $paramValue = uniqid('datum_value_');

        $paramLabel = uniqid('datum_label_');
        $queryBuilder->setParameter($paramLabel, $datumLabel);

        $paramType = uniqid('datum_type_');
        $queryBuilder->setParameter($paramType, $datumType);

        $sql = '';

        if ($operator === OperatorEnum::OPERATOR_EQUAL) {
            if ($datumType === DatumTypeEnum::TYPE_NUMBER || $datumType === DatumTypeEnum::TYPE_RATING) {
                $queryBuilder->setParameter($paramValue, $value);
                $sql = "CAST(datum.value AS INTEGER) = CAST(:{$paramValue} AS INTEGER)";
            } else {
                $queryBuilder->setParameter($paramValue, $value);
                $sql = "LOWER(datum.value) = LOWER(:{$paramValue})";
            }
        }

        if ($operator === OperatorEnum::OPERATOR_CONTAINS) {
            $queryBuilder->setParameter($paramValue, "%{$value}%");
            $sql = "LOWER(datum.value) LIKE LOWER(:{$paramValue})";
        }

        if ($operator === OperatorEnum::OPERATOR_SUPERIOR) {
            $queryBuilder->setParameter($paramValue, $value);
            $sql = "CAST(datum.value AS INTEGER) > CAST(:{$paramValue} AS INTEGER)";
        }

        if ($operator === OperatorEnum::OPERATOR_SUPERIOR_OR_EQUAL) {
            $queryBuilder->setParameter($paramValue, $value);
            $sql = "CAST(datum.value AS INTEGER) >= CAST(:{$paramValue} AS INTEGER)";
        }

        if ($operator === OperatorEnum::OPERATOR_INFERIOR) {
            $queryBuilder->setParameter($paramValue, $value);
            $sql = "CAST(datum.value AS INTEGER) < CAST(:{$paramValue} AS INTEGER)";
        }

        if ($operator === OperatorEnum::OPERATOR_INFERIOR_OR_EQUAL) {
            $queryBuilder->setParameter($paramValue, $value);
            $sql = "CAST(datum.value AS INTEGER) <= CAST(:{$paramValue} AS INTEGER)";
        }

        return "(datum.label = :{$paramLabel} AND datum.type = :{$paramType} AND {$sql})";
    }
}