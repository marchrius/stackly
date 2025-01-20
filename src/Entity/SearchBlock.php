<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\SearchBlockRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection as DoctrineCollection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: SearchBlockRepository::class)]
#[ORM\Table(name: 'koi_search_block')]
class SearchBlock
{
    #[ORM\Column(type: Types::STRING)]
    private ?string $condition = null;

    #[ORM\OneToMany(targetEntity: SearchFilter::class, cascade: ['persist'], orphanRemoval: true)]
    private DoctrineCollection $filters;

    public function __construct()
    {
        $this->filters = new ArrayCollection();
    }

    public function getCondition(): ?string
    {
        return $this->condition;
    }

    public function setCondition(?string $condition): SearchBlock
    {
        $this->condition = $condition;

        return $this;
    }

    public function getFilters(): DoctrineCollection
    {
        return $this->filters;
    }

    public function addFilter(SearchFilter $filter): SearchBlock
    {
        if (!$this->filters->contains($filter)) {
            $this->filters[] = $filter;
        }

        return $this;
    }

    public function removeFilter(SearchFilter $filter): SearchBlock
    {
        if ($this->filters->contains($filter)) {
            $this->filters->removeElement($filter);
        }

        return $this;
    }
}
