<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\SearchFilterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SearchFilterRepository::class)]
#[ORM\Table(name: 'koi_search_filter')]
class SearchFilter
{
    #[ORM\Id]
    #[ORM\Column(type: Types::STRING, length: 36, unique: true, options: ['fixed' => true])]
    private string $id;

    #[ORM\Column(type: Types::STRING, nullable: true)]
    private ?string $condition = null;

    #[ORM\Column(type: Types::STRING)]
    private ?string $type = null;

    #[ORM\Column(type: Types::STRING, nullable: true)]
    private ?string $datumLabel = null;

    #[ORM\Column(type: Types::STRING, nullable: true)]
    private ?string $datumType = null;

    #[ORM\Column(type: Types::STRING)]
    private ?string $operator = null;

    #[ORM\Column(type: Types::STRING)]
    private ?string $value = null;

    #[ORM\ManyToOne(targetEntity: SearchBlock::class, inversedBy: 'filters')]
    private SearchBlock $block;

    public function __construct()
    {
        $this->id = Uuid::v7()->toRfc4122();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getCondition(): ?string
    {
        return $this->condition;
    }

    public function setCondition(?string $condition): SearchFilter
    {
        if ($condition === '') {
            $condition = null;
        }

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

    public function getBlock(): SearchBlock
    {
        return $this->block;
    }

    public function setBlock(SearchBlock $block): SearchFilter
    {
        $this->block = $block;

        return $this;
    }
}
