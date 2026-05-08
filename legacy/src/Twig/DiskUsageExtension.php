<?php

declare(strict_types=1);

namespace App\Twig;

use App\Entity\User;
use App\Service\DiskUsageCalculator;
use Twig\Attribute\AsTwigFunction;

class DiskUsageExtension
{
    public function __construct(
        private readonly DiskUsageCalculator $diskUsageCalculator
    ) {
    }

    #[AsTwigFunction('getSpaceUsedByUser')]
    public function getSpaceUsedByUser(User $user): float
    {
        return $this->diskUsageCalculator->getSpaceUsedByUser($user);
    }

    #[AsTwigFunction('getSpaceUsedByUsers')]
    public function getSpaceUsedByUsers(): float
    {
        return $this->diskUsageCalculator->getSpaceUsedByUsers();
    }
}
