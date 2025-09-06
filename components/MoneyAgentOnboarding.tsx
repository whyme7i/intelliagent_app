
import React, { useState } from 'react';
import { MONEY_AGENT_RISK_LEVELS, MONEY_AGENT_GOALS } from '../constants';
import { DollarSignIcon } from './icons/DollarSignIcon';

interface MoneyAgentOnboardingProps {
    onSubmit: (data: { income: string; risk: 'Low' | 'Medium' | 'High'; goal: string; }) => void;
}

const Select: React.FC<{ label: string; value: string; options: string[]; onChange: (val: string) => void }> = ({ label, value, options, onChange }) => (
  <div>
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);


export const MoneyAgentOnboarding: React.FC<MoneyAgentOnboardingProps> = ({ onSubmit }) => {
    const [income, setIncome] = useState('$5,000 - $10,000');
    const [risk, setRisk] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [goal, setGoal] = useState(MONEY_AGENT_GOALS[1]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ income, risk, goal });
    }

    return (
        <div className="animate-fade-in-up p-6 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
                <div className="inline-block bg-yellow-400/20 dark:bg-yellow-500/20 p-4 rounded-full mb-3">
                    <DollarSignIcon className="w-10 h-10 text-yellow-500 dark:text-yellow-400" />
                </div>
                <h1 className="text-2xl font-bold">Alpha Investor Onboarding</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Provide your financial context for tailored strategies.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Select
                    label="What is your approximate monthly income (USD)?"
                    value={income}
                    onChange={setIncome}
                    options={['<$1,000', '$1,000 - $2,500', '$2,500 - $5,000', '$5,000 - $10,000', '$10,000+']}
                />
                 <Select
                    label="What is your risk tolerance?"
                    value={risk}
                    onChange={(val) => setRisk(val as 'Low'|'Medium'|'High')}
                    options={MONEY_AGENT_RISK_LEVELS}
                />
                 <Select
                    label="What is your primary financial goal?"
                    value={goal}
                    onChange={setGoal}
                    options={MONEY_AGENT_GOALS}
                />
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                    Begin Analysis
                </button>
            </form>
        </div>
    )
}
