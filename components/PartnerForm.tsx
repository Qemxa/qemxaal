import React, { useState } from 'react';
import { PartnerProfile, Product, ListedService, UserTier } from '../types';
import { PARTNER_TIER_LIMITS } from '../constants';
import { BackIcon, PlusIcon, StoreIcon, TrashIcon, EditIcon, StarIcon, CheckIcon, ImageIcon, WrenchScrewdriverIcon, UsersIcon, BarChartIcon, InfoIcon } from './IconComponents';
import { PartnerStatistics } from './PartnerStatistics';
import toast from 'react-hot-toast';

// --- Sub-component: ProductForm ---
const ProductForm: React.FC<{
    onSave: (product: Omit<Product, 'id'>) => void,
    onCancel: () => void,
    initialData?: Product | null
}> = ({ onSave, onCancel, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [price, setPrice] = useState<number | ''>(initialData?.price || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
    const [oemNumber, setOemNumber] = useState(initialData?.oemNumber || '');
    const [condition, setCondition] = useState<'new' | 'used'>(initialData?.condition || 'new');
    const [compatibleModels, setCompatibleModels] = useState(initialData?.compatibleModels || '');
    const [crossReferenceCodes, setCrossReferenceCodes] = useState(initialData?.crossReferenceCodes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || price === '' || !oemNumber || !compatibleModels) return;
        onSave({ name, price: Number(price), description, imageUrl, oemNumber, condition, compatibleModels, crossReferenceCodes });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-background rounded-lg space-y-3 my-4 border border-secondary">
             <h4 className="text-lg font-bold text-text-main">{initialData ? 'პროდუქტის რედაქტირება' : 'ახალი პროდუქტის დამატება'}</h4>
             
             {/* Main Info */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="* პროდუქტის დასახელება" required className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"/>
                 <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="* ფასი (₾)" required className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"/>
             </div>

            {/* AI Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <input type="text" value={oemNumber} onChange={e => setOemNumber(e.target.value)} placeholder="* OEM ნომერი" required className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"/>
                 <select value={condition} onChange={e => setCondition(e.target.value as 'new' | 'used')} required className="w-full bg-surface text-text-main border border-secondary rounded-md p-2">
                     <option value="new">ახალი</option>
                     <option value="used">მეორადი</option>
                 </select>
            </div>
             <textarea value={compatibleModels} onChange={e => setCompatibleModels(e.target.value)} placeholder="* თავსებადი მოდელები (მაგ: BMW E90, Mercedes W211)" rows={2} required className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"></textarea>
             <textarea value={crossReferenceCodes} onChange={e => setCrossReferenceCodes(e.target.value)} placeholder="ჯვარედინი კოდები (მძიმით გამოყოფილი)" rows={2} className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"></textarea>

             {/* Optional Fields */}
             <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="მოკლე აღწერა" rows={2} className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"></textarea>
             <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="სურათის URL" className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"/>

             <p className="text-xs text-text-dim">* - ველის შევსება სავალდებულოა</p>

             <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-3 py-1 text-sm bg-secondary rounded-md">გაუქმება</button>
                <button type="submit" className="px-3 py-1 text-sm bg-primary text-white rounded-md">შენახვა</button>
             </div>
        </form>
    );
};


// --- Sub-component: ServiceForm ---
const ServiceForm: React.FC<{
    onSave: (service: Omit<ListedService, 'id'>) => void,
    onCancel: () => void,
    initialData?: ListedService | null
}> = ({ onSave, onCancel, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [estimatedPrice, setEstimatedPrice] = useState(initialData?.estimatedPrice || '');
    const [description, setDescription] = useState(initialData?.description || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onSave({ name, estimatedPrice, description });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-background rounded-lg space-y-3 my-4 border border-secondary">
             <h4 className="text-lg font-bold text-text-main">{initialData ? 'სერვისის რედაქტირება' : 'ახალი სერვისის დამატება'}</h4>
             <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="სერვისის დასახელება" required className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"/>
             <input type="text" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)} placeholder="სავარაუდო ფასი (მაგ: 50-80₾)" className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"/>
             <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="მოკლე აღწერა" rows={2} className="w-full bg-surface text-text-main border border-secondary rounded-md p-2"></textarea>
             <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-3 py-1 text-sm bg-secondary rounded-md">გაუქმება</button>
                <button type="submit" className="px-3 py-1 text-sm bg-primary text-white rounded-md">შენახვა</button>
             </div>
        </form>
    );
};

// --- Sub-component: ProductListEditor ---
const ProductListEditor: React.FC<{
    profile: PartnerProfile;
    setProfile: React.Dispatch<React.SetStateAction<PartnerProfile>>;
}> = ({ profile, setProfile }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<Product | ListedService | null>(null);

    const limit = PARTNER_TIER_LIMITS[profile.tier].listingLimit;
    const isPartsShop = profile.type === 'parts';
    const items = isPartsShop ? profile.products : profile.services;
    const limitReached = items.length >= limit;

    const handleSave = (itemData: Omit<Product, 'id'> | Omit<ListedService, 'id'>) => {
        let updatedItems;
        if (editingItem) {
            updatedItems = items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i);
        } else {
            const newItem = { ...itemData, id: `${profile.type}-${Date.now()}` };
            updatedItems = [...items, newItem];
        }

        if (isPartsShop) {
            setProfile({ ...profile, products: updatedItems as Product[] });
        } else {
            setProfile({ ...profile, services: updatedItems as ListedService[] });
        }

        setIsAdding(false);
        setEditingItem(null);
    };

    const handleDelete = (itemId: string) => {
        if (!window.confirm("დარწმუნებული ხართ რომ გსურთ ამ ჩანაწერის წაშლა?")) return;
        const updatedItems = items.filter(i => i.id !== itemId);
        if (isPartsShop) {
            setProfile({ ...profile, products: updatedItems as Product[] });
        } else {
            setProfile({ ...profile, services: updatedItems as ListedService[] });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-text-main">{isPartsShop ? 'პროდუქტები' : 'სერვისები'} ({items.length}/{limit})</h3>
                <button onClick={() => { setEditingItem(null); setIsAdding(!isAdding);}} disabled={limitReached && !isAdding} className="flex items-center gap-2 px-3 py-1 text-sm bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-secondary">
                    <PlusIcon className="w-4 h-4"/>
                    {isAdding ? 'დახურვა' : 'დამატება'}
                </button>
            </div>
            {limitReached && !isAdding && <p className="text-amber-400 text-sm">თქვენ მიაღწიეთ ლიმიტს. მეტის დასამატებლად, განაახლეთ პაკეტი.</p>}
            
            {isAdding && !editingItem && (isPartsShop ?
                <ProductForm onSave={handleSave as any} onCancel={() => setIsAdding(false)} /> :
                <ServiceForm onSave={handleSave as any} onCancel={() => setIsAdding(false)} />
            )}
            {editingItem && (isPartsShop ?
                <ProductForm onSave={handleSave as any} onCancel={() => setEditingItem(null)} initialData={editingItem as Product} /> :
                <ServiceForm onSave={handleSave as any} onCancel={() => setEditingItem(null)} initialData={editingItem as ListedService} />
            )}

            <div className="space-y-3">
                {items.length === 0 && <p className="text-center text-text-dim py-4">დამატებული პროდუქტები ან სერვისები არ არის.</p>}
                {items.map(item => (
                    <div key={item.id} className="bg-surface p-3 rounded-lg group">
                        <div className="flex items-start gap-3">
                            {isPartsShop && (item as Product).imageUrl && <img src={(item as Product).imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />}
                            <div className="flex-1">
                                <h4 className="font-semibold text-text-light">{item.name}</h4>
                                {isPartsShop && (
                                     <div className="text-xs text-text-dim mt-1 space-x-3">
                                        <span>OEM: <strong>{(item as Product).oemNumber}</strong></span>
                                        <span className={`capitalize px-2 py-0.5 rounded-full text-white ${(item as Product).condition === 'new' ? 'bg-green-600' : 'bg-amber-600'}`}>
                                            {(item as Product).condition === 'new' ? 'ახალი' : 'მეორადი'}
                                        </span>
                                    </div>
                                )}
                                <p className="text-sm text-text-dim mt-1">{item.description}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-primary">{isPartsShop ? `${(item as Product).price}₾` : (item as ListedService).estimatedPrice}</p>
                            </div>
                        </div>
                        <div className="flex justify-end items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingItem(item); setIsAdding(false); }} className="p-2 rounded-full hover:bg-secondary"><EditIcon className="w-4 h-4 text-text-light"/></button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 rounded-full hover:bg-secondary"><TrashIcon className="w-4 h-4 text-red-400"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Sub-component: PartnerTierSwitcher ---
const tierData: { id: UserTier; name: string; price: string; tagline: string; recommended?: boolean; style: { border: string; bg: string; text: string; button:string; hover: string;} }[] = [
    { 
        id: 'free', name: 'სტარტერი', price: '₾0', tagline: 'დაიწყეთ და გამოჩნდით ჩვენს ბაზაზე',
        style: { border: 'border-secondary', bg: 'bg-surface', text: 'text-text-light', button: 'bg-surface-hover', hover: 'hover:bg-secondary' }
    },
    { 
        id: 'premium', name: 'პრემიუმი', price: '₾150.00', tagline: 'გაზარდეთ თქვენი ბიზნესი AI რეკომენდაციებით', recommended: true,
        style: { border: 'border-primary', bg: 'bg-primary/10', text: 'text-primary', button: 'bg-primary', hover: 'hover:bg-primary-hover' }
    },
    { 
        id: 'platinum', name: 'პლატინა', price: '₾250.00', tagline: 'დომინირეთ ბაზარზე პრიორიტეტული ჩვენებით',
        style: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', button: 'bg-purple-500', hover: 'hover:bg-purple-600' }
    },
];

const PartnerTierSwitcher: React.FC<{
    profile: PartnerProfile;
    setProfile: (profile: PartnerProfile) => void;
}> = ({ profile, setProfile }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleChoosePlan = async (tierId: UserTier) => {
        if (profile.tier === tierId || isLoading) return;

        if (tierId === 'free') {
            toast('უფასო პაკეტზე დაბრუნება ამჟამად არ არის მხარდაჭერილი.', { icon: 'ℹ️' });
            return;
        }

        setIsLoading(true);
        toast.loading('გადახდის გვერდზე გადამისამართება...');

        try {
            const response = await fetch('/api/create-stripe-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tierId,
                    type: 'partner',
                    profileId: profile.id,
                    userId: profile.user_id,
                })
            });

            if (!response.ok) {
                throw new Error('Stripe სესიის შექმნა ვერ მოხერხდა.');
            }

            const session = await response.json();
            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error('Stripe-ის მისამართი ვერ მოიძებნა.');
            }
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message);
            setIsLoading(false);
        }
    };

    return (
         <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-text-main">აირჩიეთ თქვენი ბიზნესისთვის საუკეთესო პლანი</h2>
                <p className="text-text-dim mt-2">გახსენით ახალი შესაძლებლობები და მიიზიდეთ მეტი კლიენტი.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {tierData.map((tier) => {
                    const features = PARTNER_TIER_LIMITS[tier.id].features;
                    const isCurrent = profile.tier === tier.id;
                    const isUpgrade = (tier.id === 'premium' && profile.tier === 'free') || (tier.id === 'platinum' && (profile.tier === 'free' || profile.tier === 'premium'));
                    return (
                        <div key={tier.id} className={`relative flex flex-col p-6 rounded-2xl border-2 transition-transform duration-300 ${tier.style.bg} ${tier.style.border} ${isCurrent ? 'transform scale-105 shadow-xl' : 'hover:-translate-y-1'}`}>
                            {tier.recommended && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-3 py-1 text-sm font-semibold text-white bg-primary rounded-full">ყველაზე პოპულარული</div>}
                            
                            <div className="flex-grow">
                                <h3 className={`text-2xl font-bold ${tier.style.text}`}>{tier.name}</h3>
                                <p className="text-sm text-text-dim h-10 mt-1">{tier.tagline}</p>
                                <div className="my-6">
                                    <span className="text-4xl font-extrabold text-text-main">{tier.price}</span>
                                    <span className="text-text-dim">/თვე</span>
                                </div>
                                <ul className="space-y-3 text-text-light text-sm">
                                    {features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <CheckIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.style.text}`} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8">
                                <button
                                  onClick={() => handleChoosePlan(tier.id)}
                                  disabled={isCurrent || isLoading}
                                  className={`w-full font-semibold py-3 rounded-lg transition-colors ${isCurrent ? 'bg-green-600 text-white cursor-default' : `${tier.style.button} ${tier.style.hover} text-white disabled:opacity-70 disabled:cursor-wait`}`}
                                >
                                    {isLoading && !isCurrent ? 'მიმდინარეობს...' : (isCurrent ? 'მიმდინარე პლანი' : 'პლანის არჩევა')}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
};


// --- Main Component: PartnerDashboard ---
interface PartnerDashboardProps {
    initialProfile: PartnerProfile;
    onSave: (profile: PartnerProfile) => void;
    onBack: () => void;
    onDelete: (profileId: string) => void;
}

type PartnerDashboardTab = 'profile' | 'listings' | 'tier' | 'statistics';

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ initialProfile, onSave, onBack, onDelete }) => {
    const [profile, setProfile] = useState<PartnerProfile>(initialProfile);
    const [activeTab, setActiveTab] = useState<PartnerDashboardTab>('profile');

    const handleSave = () => {
        // Save only if there are actual changes to tier, locally.
        // The real tier change happens via webhook.
        // We only save other profile details here.
        const originalTier = initialProfile.tier;
        onSave({ ...profile, tier: originalTier });
    };
    
    const renderContent = () => {
        switch(activeTab) {
            case 'profile':
                return (
                    <div className="space-y-4">
                         <h3 className="text-xl font-bold text-text-main">პროფილის რედაქტირება</h3>
                         <div>
                            <label className="block text-sm font-medium text-text-light mb-1">დასახელება</label>
                            <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-background text-text-main border border-secondary rounded-md p-2"/>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-text-light mb-1">ტიპი</label>
                            <select value={profile.type} onChange={e => setProfile({...profile, type: e.target.value as any})} className="w-full bg-background text-text-main border border-secondary rounded-md p-2">
                                <option value="service">ავტო-სერვისი</option>
                                <option value="parts">ნაწილების მაღაზია</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-text-light mb-1">აღწერა</label>
                            <textarea value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} rows={3} className="w-full bg-background text-text-main border border-secondary rounded-md p-2"></textarea>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-text-light mb-1">მისამართი</label>
                            <input type="text" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full bg-background text-text-main border border-secondary rounded-md p-2"/>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-text-light mb-1">ტელეფონი</label>
                            <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-background text-text-main border border-secondary rounded-md p-2"/>
                         </div>
                    </div>
                );
            case 'listings':
                return <ProductListEditor profile={profile} setProfile={setProfile} />;
            case 'statistics':
                return <PartnerStatistics profile={profile} setActiveTab={setActiveTab} />;
            case 'tier':
                return <PartnerTierSwitcher profile={profile} setProfile={setProfile} />
        }
    }

    return (
        <div className="min-h-screen w-screen bg-background text-text-main p-4">
             <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-6">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-hover"><BackIcon className="w-6 h-6"/></button>
                    <h1 className="text-2xl font-bold truncate">{profile.name}</h1>
                </header>

                 <div className="border-b border-secondary mb-6">
                  <nav className="flex justify-center -mb-px gap-4 sm:gap-8">
                      <button onClick={() => setActiveTab('profile')} className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-text-dim'}`}><UsersIcon className="w-5 h-5"/>პროფილი</button>
                      <button onClick={() => setActiveTab('listings')} className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'listings' ? 'border-primary text-primary' : 'border-transparent text-text-dim'}`}><StoreIcon className="w-5 h-5"/>პროდუქტები/სერვისები</button>
                      <button onClick={() => setActiveTab('statistics')} className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'statistics' ? 'border-primary text-primary' : 'border-transparent text-text-dim'}`}><BarChartIcon className="w-5 h-5"/>სტატისტიკა</button>
                      <button onClick={() => setActiveTab('tier')} className={`py-3 px-1 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'tier' ? 'border-primary text-primary' : 'border-transparent text-text-dim'}`}><StarIcon className="w-5 h-5"/>პაკეტები</button>
                  </nav>
                </div>

                <div className="mb-8">
                  {renderContent()}
                </div>

                <div className="flex items-center justify-between gap-4 mt-12 py-4 border-t border-secondary">
                    <button onClick={() => onDelete(profile.id)} className="px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-md flex items-center gap-2"><TrashIcon className="w-4 h-4"/> პროფილის წაშლა</button>
                    <button onClick={handleSave} className="px-6 py-2 font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover">ცვლილებების შენახვა</button>
                </div>
            </div>
        </div>
    );
};

export default PartnerDashboard;