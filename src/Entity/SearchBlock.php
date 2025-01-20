<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\SearchBlockRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection as DoctrineCollection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SearchBlockRepository::class)]
#[ORM\Table(name: 'koi_search_block')]
class SearchBlock
{
    #[ORM\Id]
    #[ORM\Column(type: Types::STRING, length: 36, unique: true, options: ['fixed' => true])]
    private string $id;

    #[ORM\Column(type: Types::STRING, nullable: true)]
    private ?string $condition = null;

    #[ORM\OneToMany(targetEntity: SearchFilter::class, mappedBy: 'block', cascade: ['persist'], orphanRemoval: true)]
    private DoctrineCollection $filters;

    #[ORM\ManyToOne(targetEntity: Search::class, inversedBy: 'blocks')]
    private Search $search;

    public function __construct()
    {
        $this->id = Uuid::v7()->toRfc4122();
        $this->filters = new ArrayCollection();
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getCondition(): ?string
    {
        return $this->condition;
    }

    public function setCondition(?string $condition): SearchBlock
    {
        if ($condition === '') {
            $condition = null;
        }

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
            $filter->setBlock($this);
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

    public function getSearch(): Search
    {
        return $this->search;
    }

    public function setSearch(Search $search): SearchBlock
    {
        $this->search = $search;

        return $this;
    }
}
