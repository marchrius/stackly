<?php

declare(strict_types=1);

namespace App\Twig;

use App\Repository\CollectionRepository;
use App\Repository\DatumRepository;
use Twig\Attribute\AsTwigFunction;

class AdvancedItemSearchExtension
{
    public function __construct(
        private readonly DatumRepository $datumRepository,
        private readonly CollectionRepository $collectionRepository
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
}
