<?php

declare(strict_types=1);

namespace App\Form\Type\Entity;

use App\Entity\Search;
use App\Enum\DatumTypeEnum;
use App\Enum\DisplayModeEnum;
use App\Repository\DatumRepository;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SearchType extends AbstractType
{
    public function __construct(private readonly DatumRepository $datumRepository)
    {
    }

    #[\Override]
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $datumColumns = [];
        foreach ($this->datumRepository->findAllItemsLabelsByType(DatumTypeEnum::TEXT_TYPES) as $datum) {
            $datumColumns[$datum['label']] = $datum['label'];
        }


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
            ->add('columns', ChoiceType::class, [
                'choices' => $datumColumns,
                'multiple' => true,
                'expanded' => false,
                'required' => false
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
