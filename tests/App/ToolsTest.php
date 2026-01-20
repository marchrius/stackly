<?php

declare(strict_types=1);

namespace App\Tests\App;

use App\Tests\AppTestCase;
use App\Tests\Factory\CollectionFactory;
use App\Tests\Factory\ItemFactory;
use App\Tests\Factory\UserFactory;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpFoundation\Request;
use Zenstruck\Foundry\Test\Factories;
use Zenstruck\Foundry\Test\ResetDatabase;

class ToolsTest extends AppTestCase
{
    use Factories;
    use ResetDatabase;

    private KernelBrowser $client;

    #[\Override]
    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->client->followRedirects();
    }

    public function test_can_see_tools(): void
    {
        // Arrange
        $user = UserFactory::createOne();
        $this->client->loginUser($user);

        // Act
        $crawler = $this->client->request(Request::METHOD_GET, '/tools');

        // Assert
        $this->assertResponseIsSuccessful();
        $this->assertSame('Tools', $crawler->filter('h1')->text());
    }

    public function test_can_export_printable_list(): void
    {
        // Arrange
        $user = UserFactory::createOne();
        $this->client->loginUser($user);
        $collection = CollectionFactory::createOne(['title' => 'Frieren', 'owner' => $user]);
        ItemFactory::createOne(['name' => 'Frieren #1', 'collection' => $collection, 'owner' => $user]);
        ItemFactory::createOne(['name' => 'Frieren #2', 'collection' => $collection, 'owner' => $user]);
        ItemFactory::createOne(['name' => 'Frieren #3', 'collection' => $collection, 'owner' => $user]);

        // Act
        $crawler = $this->client->request(Request::METHOD_GET, '/tools/export/printable-list');

        // Assert
        $this->assertResponseIsSuccessful();
        $this->assertCount(1, $crawler->filter('.print'));
    }

    public function test_can_export_csv(): void
    {
        // Arrange
        $user = UserFactory::createOne();
        $this->client->loginUser($user);
        $collection = CollectionFactory::createOne(['title' => 'Frieren', 'owner' => $user]);
        ItemFactory::createOne(['name' => 'Frieren #1', 'collection' => $collection, 'owner' => $user]);
        ItemFactory::createOne(['name' => 'Frieren #2', 'collection' => $collection, 'owner' => $user]);
        ItemFactory::createOne(['name' => 'Frieren #3', 'collection' => $collection, 'owner' => $user]);

        // Act
        $this->client->request(Request::METHOD_GET, '/tools/export/csv');

        // Assert
        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'text/csv; charset=UTF-8');
    }
}
