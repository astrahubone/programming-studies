import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  LineChart,
  Sparkles,
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: 'Estudo Inteligente',
      description:
        'Sistema adaptativo que gera questões personalizadas baseadas no seu nível de conhecimento.',
    },
    {
      icon: Calendar,
      title: 'Cronograma Flexível',
      description:
        'Organize seus estudos com um calendário intuitivo e adaptável à sua rotina.',
    },
    {
      icon: LineChart,
      title: 'Análise de Desempenho',
      description:
        'Acompanhe seu progresso com métricas detalhadas e insights valiosos.',
    },
    {
      icon: Clock,
      title: 'Revisão Espaçada',
      description:
        'Sistema de revisão baseado em evidências científicas para retenção máxima.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
            <img src='src\assets\RBlack.png' className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Revizium
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block">Revolucione seus</span>
              <span className="block text-indigo-600 dark:text-indigo-400">
                estudos
              </span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Uma plataforma completa para otimizar seu aprendizado e maximizar
              seu desempenho nos estudos.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/register"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  Comece Gratuitamente
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Tudo que você precisa para ter sucesso
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
              Ferramentas poderosas para impulsionar seus estudos
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="pt-6 relative"
                  >
                    <div className="flow-root bg-gray-50 dark:bg-gray-900 rounded-lg px-6 pb-8">
                      <div className="-mt-6">
                        <div>
                          <span className="inline-flex items-center justify-center p-3 bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-lg">
                            <Icon className="h-6 w-6 text-white" />
                          </span>
                        </div>
                        <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                          {feature.title}
                        </h3>
                        <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Planos e Preços
            </h2>
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
              Escolha o plano ideal para você
            </p>
          </div>

          <div className="mt-20 max-w-lg mx-auto">
            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
              <div className="p-8">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Plano Premium
                </h3>
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Acesso completo a todas as funcionalidades
                </p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    R$ 49,90
                  </span>
                  <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                    /mês
                  </span>
                </p>

                <ul className="mt-8 space-y-4">
                  {[
                    'Questões ilimitadas',
                    'Análise de desempenho detalhada',
                    'Cronograma personalizado',
                    'Suporte prioritário',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="ml-3 text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    // TODO: Implement Stripe checkout
                  }}
                  className="mt-8 w-full bg-indigo-600 text-white hover:bg-indigo-700 py-3 px-6 rounded-md text-center font-medium"
                >
                  Assinar Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
            <img src='src\assets\RBlack.png' className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Revizium
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              © 2025 Revizium. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}