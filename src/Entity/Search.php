<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\DisplayModeEnum;
use App\Repository\SearchRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\Collection as DoctrineCollection;

#[ORM\Entity(repositoryClass: SearchRepository::class)]
#[ORM\Table(name: 'koi_search')]
class Search
{
    private string $displayMode = DisplayModeEnum::DISPLAY_MODE_GRID;

    #[ORM\OneToMany(targetEntity: SearchBlock::class, cascade: ['persist'], orphanRemoval: true)]
    private DoctrineCollection $blocks;

    public function __construct()
    {
        $this->blocks = new ArrayCollection();

        $filter = new SearchFilter();
        $block = new SearchBlock();

        $block->addFilter($filter);
        $this->addBlock($block);
    }

    public function getDisplayMode(): string
    {
        return $this->displayMode;
    }

    public function setDisplayMode(string $displayMode): Search
    {
        $this->displayMode = $displayMode;

        return $this;
    }

    public function getBlocks(): DoctrineCollection
    {
        return $this->blocks;
    }

    public function addBlock(SearchBlock $block): Search
    {
        if (!$this->blocks->contains($block)) {
            $this->blocks[] = $block;
        }

        return $this;
    }

    public function removeBlock(SearchBlock $block): Search
    {
        if ($this->blocks->contains($block)) {
            $this->blocks->removeElement($block);
        }

        return $this;
    }
}
