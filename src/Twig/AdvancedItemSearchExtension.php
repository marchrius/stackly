<?php

declare(strict_types=1);

namespace App\Twig;

use App\Repository\CollectionRepository;
use App\Repository\DatumRepository;
use App\Repository\TagRepository;
use Twig\Attribute\AsTwigFunction;

class AdvancedItemSearchExtension
{
    public function __construct(
        private readonly DatumRepository $datumRepository,
        private readonly CollectionRepository $collectionRepository,
        private readonly TagRepository $tagRepository
    ) {
    }
    
    #[AsTwigFunction('getListValuesFromDatumLabelAndType')]
    public function getListValuesFromDatumLabelAndType(?string $label, string $type): array
    {
        return $this->datumRepository->findAllUniqueListValues($label, $type);
    }

    #[AsTwigFunction('getUserCollections')]
    public function getUserCollections(): array
    {
        return $this->collectionRepository->findBy([], ['title' => 'ASC']);
    }

    #[AsTwigFunction('getUserTags')]
    public function getUserTags(): array
    {
        return $this->tagRepository->findBy([], ['label' => 'ASC']);
    }
}
