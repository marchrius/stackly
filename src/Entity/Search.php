<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiProperty;
use App\Entity\Interfaces\BreadcrumbableInterface;
use App\Repository\SearchRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Order;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\Collection as DoctrineCollection;
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

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    private ?int $numberOfResults = null;

    #[ORM\OneToMany(targetEntity: SearchBlock::class, mappedBy: 'search', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => Order::Ascending->value])]
    private DoctrineCollection $blocks;

    #[ApiProperty(readableLink: false, writableLink: false)]
    #[ORM\OneToOne(targetEntity: DisplayConfiguration::class, cascade: ['all'])]
    private ?DisplayConfiguration $displayConfiguration = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'searches')]
    private ?User $owner = null;

    public function __construct()
    {
        $this->id = Uuid::v7()->toRfc4122();
        $this->blocks = new ArrayCollection();

        $filter = new SearchFilter();
        $block = new SearchBlock();

        $block->addFilter($filter);
        $this->addBlock($block);

        $this->displayConfiguration = new DisplayConfiguration();
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

    public function getNumberOfResults(): ?int
    {
        return $this->numberOfResults;
    }

    public function setNumberOfResults(?int $numberOfResults): Search
    {
        $this->numberOfResults = $numberOfResults;

        return $this;
    }

    public function getDisplayConfiguration(): ?DisplayConfiguration
    {
        return $this->displayConfiguration;
    }

    public function setDisplayConfiguration(?DisplayConfiguration $displayConfiguration): Search
    {
        $this->displayConfiguration = $displayConfiguration;

        return $this;
    }
}
