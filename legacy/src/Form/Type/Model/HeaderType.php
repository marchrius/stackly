<?php

declare(strict_types=1);

namespace App\Form\Type\Model;

use App\Model\Scraper\Header;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class HeaderType extends AbstractType
{
    #[\Override]
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('header', TextType::class, [
                'required' => true,
                'attr' => ['length' => 255],
            ])
            ->add('value', TextType::class, [
                'required' => true,
                'attr' => ['length' => 255],
            ])
        ;
    }

    #[\Override]
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Header::class,
        ]);
    }
}
