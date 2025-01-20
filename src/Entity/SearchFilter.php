<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\SearchFilterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SearchFilterRepository::class)]
#[ORM\Table(name: 'koi_search_filter')]
class SearchFilter
{
    #[ORM\Column(type: Types::STRING)]
    private ?string $condition = null;

    #[ORM\Column(type: Types::STRING)]
    private ?string $type = null;

    #[ORM\Column(type: Types::STRING)]
    private ?string $datumLabel = null;

    #[ORM\Column(type: Types::STRING)]
    private ?string $datumType = null;

    #[ORM\Column(type: Types::STRING)]
    private ?string $operator = null;

    #[ORM\Column(type: Types::STRING)]
    private ?string $value = null;

    public function getCondition(): ?string
    {
        return $this->condition;
    }

    public function setCondition(?string $condition): SearchFilter
    {
        $this->condition = $condition;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(?string $type): SearchFilter
    {
        $this->type = $type;

        return $this;
    }

    public function getDatumLabel(): ?string
    {
        return $this->datumLabel;
    }

    public function setDatumLabel(?string $datumLabel): SearchFilter
    {
        $this->datumLabel = $datumLabel;

        return $this;
    }

    public function getDatumType(): ?string
    {
        return $this->datumType;
    }

    public function setDatumType(?string $datumType): SearchFilter
    {
        $this->datumType = $datumType;

        return $this;
    }

    public function getOperator(): ?string
    {
        return $this->operator;
    }

    public function setOperator(?string $operator): SearchFilter
    {
        $this->operator = $operator;

        return $this;
    }

    public function getValue(): ?string
    {
        return $this->value;
    }

    public function setValue(?string $value): SearchFilter
    {
        $this->value = $value;

        return $this;
    }
}
