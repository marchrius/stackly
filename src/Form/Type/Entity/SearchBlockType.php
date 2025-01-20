<?php

declare(strict_types=1);

namespace App\Form\Type\Entity;

use App\Entity\SearchBlock;
use App\Enum\AdvancedItemSearch\ConditionEnum;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SearchBlockType extends AbstractType
{
    #[\Override]
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('condition', ChoiceType::class, [
                'choices' => array_flip(ConditionEnum::getConditionLabels()),
                'required' => true
            ])
            ->add('filters', CollectionType::class, [
                'entry_type' => SearchFilterType::class,
                'entry_options' => ['label' => false],
                'label' => false,
                'allow_add' => true,
                'allow_delete' => true,
                'by_reference' => false
            ])
        ;
    }

    #[\Override]
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => SearchBlock::class
        ]);
    }
}
