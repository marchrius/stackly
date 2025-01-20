<?php

declare(strict_types=1);

namespace App\Migrations\Postgresql;

use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250120213359 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '[Postgresql] Add search tables.';
    }

    public function up(Schema $schema): void
    {
        $this->skipIf(!$this->connection->getDatabasePlatform() instanceof PostgreSQLPlatform, 'Migration can only be executed safely on \'postgresql\'.');

        $this->addSql('CREATE TABLE koi_search (id CHAR(36) NOT NULL, name VARCHAR(255) DEFAULT NULL, owner_id CHAR(36) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_565C814E7E3C61F9 ON koi_search (owner_id)');
        $this->addSql('CREATE TABLE koi_search_block (id CHAR(36) NOT NULL, condition VARCHAR(255) DEFAULT NULL, search_id CHAR(36) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_591D6B98650760A9 ON koi_search_block (search_id)');
        $this->addSql('CREATE TABLE koi_search_filter (id CHAR(36) NOT NULL, condition VARCHAR(255) DEFAULT NULL, type VARCHAR(255) NOT NULL, datum_label VARCHAR(255) DEFAULT NULL, datum_type VARCHAR(255) DEFAULT NULL, operator VARCHAR(255) NOT NULL, value VARCHAR(255) NOT NULL, block_id CHAR(36) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_54AA0373E9ED820C ON koi_search_filter (block_id)');
        $this->addSql('ALTER TABLE koi_search ADD CONSTRAINT FK_565C814E7E3C61F9 FOREIGN KEY (owner_id) REFERENCES koi_user (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE koi_search_block ADD CONSTRAINT FK_591D6B98650760A9 FOREIGN KEY (search_id) REFERENCES koi_search (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE koi_search_filter ADD CONSTRAINT FK_54AA0373E9ED820C FOREIGN KEY (block_id) REFERENCES koi_search_block (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->skipIf(true, 'Always move forward.');
    }
}
