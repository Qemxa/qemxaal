import React, { useMemo } from 'react';
import { PartnerProfile, Product, ListedService } from '../types';
import { BarChartIcon, StarIcon, UsersIcon, AiIcon, DownloadIcon, TrendingUpIcon, InfoIcon, StoreIcon, WrenchScrewdriverIcon } from './IconComponents';

const StatCard: React.FC<{ title: string; value: string; trend: string; icon: React.ReactNode; }> = ({ title, value, trend, icon }) => (
    <div className="bg-surface p-5 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-dim">
            <p className="text-sm font-medium">{title}</p>
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-text-main mt-2">{value}</p>
            <div className="flex items-center gap-1 text-sm text-green-400">
                <TrendingUpIcon className="w-4 h-4"/>
                <span>{trend}</span>
                <span className="text-text-dim">vs. last month</span>
            </div>
        </div>
    </div>
);

const LineChart: React.FC<{ data: { date: string, value: number }[]; color: string; }> = ({ data, color }) => {
    const width = 500;
    const height = 150;
    const padding = 20;
    const maxValue = Math.max(...data.map(p => p.value), 0);
    const yMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 10;
    const xStep = (width - padding * 2) / (data.length - 1);
    const yStep = (height - padding * 2) / yMax;

    const path = data.map((p, i) => {
        const x = padding + i * xStep;
        const y = height - padding - p.value * yStep;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');

    const areaPath = `${path} L ${(width - padding).toFixed(2)} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
        <div className="relative h-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                {/* Y-axis lines */}
                {[0.25, 0.5, 0.75, 1].map(f => (
                    <line key={f} x1={padding} y1={(height - padding) * (1-f) + (padding * f)} x2={width - padding} y2={(height - padding) * (1-f) + (padding * f)} stroke="var(--color-secondary)" strokeWidth="1" strokeDasharray="2,3"/>
                ))}
                {/* Area Gradient */}
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                        <stop offset="100%" stopColor={color} stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#gradient-${color})`} />
                {/* Main line */}
                <path d={path} fill="none" stroke={color} strokeWidth="2" />
            </svg>
        </div>
    );
};

const DonutChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;

    return (
        <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
                 <svg viewBox="0 0 36 36" className="transform -rotate-90">
                    {data.map(item => {
                        const percentage = (item.value / total) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = -cumulative;
                        cumulative += percentage;
                        return (
                             <circle
                                key={item.label}
                                cx="18" cy="18" r="15.915"
                                fill="transparent" stroke={item.color} strokeWidth="4"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                             />
                        )
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-text-main">{total}</span>
                    <span className="text-xs text-text-dim">users</span>
                </div>
            </div>
            <ul className="space-y-2">
                {data.map(item => (
                    <li key={item.label} className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></span>
                        <span className="text-text-light">{item.label}</span>
                        <span className="font-bold text-text-main">{((item.value/total)*100).toFixed(0)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const PartnerStatistics: React.FC<{ profile: PartnerProfile; setActiveTab: (tab: 'profile' | 'listings' | 'tier' | 'statistics') => void; }> = ({ profile, setActiveTab }) => {
    
    // Mock data generation
    const stats = useMemo(() => {
        const generateDailyData = (days: number) => [...Array(days)].map((_, i) => ({
             date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
             value: Math.floor(Math.random() * (i + 15) + 10),
        }));
        
        const listings = profile.type === 'parts' ? profile.products : profile.services;

        return {
            profileViews: { value: Math.floor(Math.random() * 500) + 50, trend: `+${(Math.random() * 15 + 5).toFixed(1)}%` },
            aiRecommendations: { value: Math.floor(Math.random() * 80) + 10, trend: `+${(Math.random() * 25 + 8).toFixed(1)}%` },
            ctr: { value: ((Math.random() * 5) + 1.5).toFixed(2)+'%', trend: `+${(Math.random() * 1.2).toFixed(1)}%` },
            
            performanceData: generateDailyData(30),
            demographics: [
                { label: '18-24', value: Math.floor(Math.random() * 20), color: '#3B82F6'},
                { label: '25-34', value: Math.floor(Math.random() * 45), color: '#8B5CF6'},
                { label: '35-44', value: Math.floor(Math.random() * 30), color: '#F59E0B'},
                { label: '45+', value: Math.floor(Math.random() * 15), color: '#10B981'},
            ],
            topListings: listings
                .map(l => ({...l, recommendations: Math.floor(Math.random() * 25)}))
                .sort((a,b) => b.recommendations - a.recommendations)
                .slice(0, 5)
        };
    }, [profile.id, profile.products, profile.services, profile.type]);

    const handleExport = () => {
       alert("რეპორტის გადმოწერა ხელმისაწვდომია Premium პაკეტზე.")
    };

    const isPremium = profile.tier === 'premium' || profile.tier === 'platinum';

    const LockedFeatureOverlay = () => (
         <div className="absolute inset-0 z-10 flex items-center justify-center p-5 bg-surface/50 backdrop-blur-sm rounded-lg">
            <div className="p-6 bg-background/80 border border-primary/30 rounded-lg text-center shadow-lg max-w-md">
                <StarIcon className="w-10 h-10 mx-auto text-amber-400 mb-3" />
                <h4 className="text-lg font-bold text-text-main">გახსენით დეტალური ანალიტიკა</h4>
                <p className="text-text-dim mt-1 mb-4 text-sm">გადადით პრემიუმ პაკეტზე, რომ ნახოთ დეტალური სტატისტიკა მომხმარებლებზე, ტოპ პროდუქტებზე და გადმოწეროთ რეპორტები.</p>
                <button 
                    onClick={() => setActiveTab('tier')}
                    className="px-5 py-2 font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover">
                   პაკეტის განახლება
                </button>
             </div>
         </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-text-main">სტატისტიკის დაფა</h3>
                    <p className="text-text-dim">ბოლო 30 დღის მონაცემები</p>
                </div>
                 <button 
                    onClick={handleExport}
                    disabled={!isPremium}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-surface-hover text-text-light font-semibold rounded-lg hover:bg-secondary disabled:bg-secondary disabled:cursor-not-allowed disabled:opacity-50">
                     <DownloadIcon className="w-5 h-5" />
                     რეპორტის გადმოწერა
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="პროფილის ნახვები" value={stats.profileViews.value.toString()} trend={stats.profileViews.trend} icon={<UsersIcon className="w-5 h-5"/>}/>
                <StatCard title="AI რეკომენდაციები" value={stats.aiRecommendations.value.toString()} trend={stats.aiRecommendations.trend} icon={<AiIcon className="w-5 h-5"/>}/>
                <StatCard title="კლიკების % (CTR)" value={stats.ctr.value} trend={stats.ctr.trend} icon={<BarChartIcon className="w-5 h-5"/>}/>
            </div>

            <div className="bg-surface p-6 rounded-lg">
                <h4 className="text-lg font-bold text-text-main mb-4">დღიური აქტივობა</h4>
                 <div className="h-48">
                    <LineChart data={stats.performanceData} color="#3B82F6"/>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                {!isPremium && <LockedFeatureOverlay />}
                <div className={`bg-surface p-6 rounded-lg ${!isPremium && 'opacity-30'}`}>
                    <h4 className="text-lg font-bold text-text-main mb-4">მომხმარებლის დემოგრაფია</h4>
                    <DonutChart data={stats.demographics} />
                </div>
                 <div className={`bg-surface p-6 rounded-lg ${!isPremium && 'opacity-30'}`}>
                    <h4 className="text-lg font-bold text-text-main mb-4">ტოპ {profile.type === 'parts' ? 'პროდუქტები' : 'სერვისები'}</h4>
                    <ul className="space-y-3">
                       {stats.topListings.map(item => (
                           <li key={item.id} className="flex items-center gap-3">
                               <div className="p-2 bg-secondary rounded-md">
                                  {profile.type === 'parts' ? <StoreIcon className="w-5 h-5 text-primary"/> : <WrenchScrewdriverIcon className="w-5 h-5 text-primary"/>}
                               </div>
                               <span className="flex-grow text-text-light truncate">{item.name}</span>
                               <span className="font-bold text-text-main">{item.recommendations} რეკ.</span>
                           </li>
                       ))}
                    </ul>
                </div>
            </div>

        </div>
    );
};
