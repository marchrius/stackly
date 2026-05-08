<?php

declare(strict_types=1);

namespace App\Form\Type\Entity;

use App\Entity\DisplayConfiguration;
use App\Enum\DatumTypeEnum;
use App\Enum\DisplayModeEnum;
use App\Repository\DatumRepository;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class SearchDisplayConfigurationType extends AbstractType
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
            ->add('displayMode', ChoiceType::class, [
                'choices' => array_flip(DisplayModeEnum::getDisplayModeLabels()),
                'required' => true,
            ])
            ->add('columns', ChoiceType::class, [
                'choices' => $datumColumns,
                'multiple' => true,
                'expanded' => false,
                'required' => false
            ])
            ->add('showActions', CheckboxType::class, [
                'required' => false
            ])
            ->add('showVisibility', CheckboxType::class, [
                'required' => false
            ])
            ->add('showItemQuantities', CheckboxType::class, [
                'required' => false
            ])
        ;
    }

    #[\Override]
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => DisplayConfiguration::class
        ]);
    }
}
