<?php

declare(strict_types=1);

namespace App\Migrations\Postgresql;

use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250203210811 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[Postgresql] Allow null value column on `koi_search_filter`.';
    }

    public function up(Schema $schema): void
    {
        $this->skipIf(!$this->connection->getDatabasePlatform() instanceof PostgreSQLPlatform, 'Postgresql migration only. Skipped.');

        $this->addSql('ALTER TABLE koi_search_filter ALTER value TYPE VARCHAR(255)');
        $this->addSql('ALTER TABLE koi_search_filter ALTER value DROP NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->skipIf(true, 'Always move forward.');
    }
}
