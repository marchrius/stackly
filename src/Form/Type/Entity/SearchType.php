<?php

declare(strict_types=1);

namespace App\Form\Type\Entity;

use App\Entity\Search;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SearchType extends AbstractType
{
    #[\Override]
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('blocks', CollectionType::class, [
                'entry_type' => SearchBlockType::class,
                'entry_options' => ['label' => false],
                'prototype_name' => '__block_name__',
                'label' => false,
                'allow_add' => true,
                'allow_delete' => true
            ])
        ;
    }

    #[\Override]
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Search::class
        ]);
    }
}
