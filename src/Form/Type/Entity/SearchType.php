<?php

declare(strict_types=1);

namespace App\Form\Type\Entity;

use App\Entity\Search;
use App\Enum\DisplayModeEnum;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SearchType extends AbstractType
{
    #[\Override]
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'required' => false
            ])
            ->add('blocks', CollectionType::class, [
                'entry_type' => SearchBlockType::class,
                'entry_options' => ['label' => false],
                'prototype_name' => '__block_name__',
                'label' => false,
                'allow_add' => true,
                'allow_delete' => true,
                'by_reference' => false
            ])
            ->add('displayMode', ChoiceType::class, [
                'choices' => array_flip(DisplayModeEnum::getDisplayModeLabels()),
                'empty_data' => $builder->getData()->getDisplayMode()
            ])
            ->add('saveAndSubmit', SubmitType::class)
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
