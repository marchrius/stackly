<?php

declare(strict_types=1);

namespace App\Entity;

use App\Entity\Interfaces\BreadcrumbableInterface;
use App\Enum\DisplayModeEnum;
use App\Repository\SearchRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\Collection as DoctrineCollection;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: SearchRepository::class)]
#[ORM\Table(name: 'koi_search')]
class Search implements BreadcrumbableInterface
{
    #[ORM\Id]
    #[ORM\Column(type: Types::STRING, length: 36, unique: true, options: ['fixed' => true])]
    private string $id;

    #[ORM\Column(type: Types::STRING, nullable: true)]
    private ?string $name = null;

    private string $displayMode = DisplayModeEnum::DISPLAY_MODE_GRID;

    #[ORM\OneToMany(targetEntity: SearchBlock::class, mappedBy: 'search', cascade: ['persist'], orphanRemoval: true)]
    private DoctrineCollection $blocks;

    #[ORM\ManyToOne(targetEntity: User::class)]
    private ?User $owner = null;

    public function __construct()
    {
        $this->id = Uuid::v7()->toRfc4122();
        $this->blocks = new ArrayCollection();

        $filter = new SearchFilter();
        $block = new SearchBlock();

        $block->addFilter($filter);
        $this->addBlock($block);
    }

    public function __toString(): string
    {
        return $this->name;
    }

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): Search
    {
        $this->name = $name;

        return $this;
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
            $block->setSearch($this);
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

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): Search
    {
        $this->owner = $owner;

        return $this;
    }
}
