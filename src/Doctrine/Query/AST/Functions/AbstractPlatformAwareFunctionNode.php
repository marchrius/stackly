<?php
declare(strict_types=1);

namespace App\Doctrine\Query\AST\Functions;

use App\Doctrine\Query\AST\FunctionFactory;
use Doctrine\ORM\Query\AST\Functions\FunctionNode;
use Doctrine\ORM\Query\SqlWalker;

abstract class AbstractPlatformAwareFunctionNode extends FunctionNode
{
    public array $parameters = [];

    public function getSql(SqlWalker $sqlWalker): string
    {
        $function = FunctionFactory::create(
            $sqlWalker->getConnection()->getDatabasePlatform(),
            $this->name,
            $this->parameters
        );
        return $function->getSql($sqlWalker);
    }
}