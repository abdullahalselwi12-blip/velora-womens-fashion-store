import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order, Address } from '@/types';

type AccountTab = 'profile' | 'orders' | 'addresses';

export function AccountPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { t, tl, lang } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    recipient_name: '', phone: '', country: 'Yemen', city: '', region: '', street_address: '', additional_details: '', is_default: false,
  });
  const [editingAddressId, setEditingAddressId] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (profile) {
      setProfileForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
    }
    (async () => {
      const [ordersRes, addrRes] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (addrRes.data) setAddresses(addrRes.data as Address[]);
      setLoadingData(false);
    })();
  }, [user, profile, navigate]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profileForm.full_name, phone: profileForm.phone })
      .eq('id', user!.id);
    if (error) {
      showToast(t('msg.error'), 'error');
    } else {
      await refreshProfile();
      showToast(t('msg.profileUpdated'), 'success');
    }
    setSavingProfile(false);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId) {
      const { error } = await supabase.from('addresses').update(addressForm).eq('id', editingAddressId);
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.updated'), 'success');
    } else {
      const { error } = await supabase.from('addresses').insert({ ...addressForm, user_id: user!.id });
      if (error) { showToast(t('msg.error'), 'error'); return; }
      showToast(t('msg.created'), 'success');
    }
    setShowAddressForm(false);
    setEditingAddressId('');
    setAddressForm({ recipient_name: '', phone: '', country: 'Yemen', city: '', region: '', street_address: '', additional_details: '', is_default: false });
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false });
    if (data) setAddresses(data as Address[]);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      recipient_name: addr.recipient_name, phone: addr.phone, country: addr.country, city: addr.city,
      region: addr.region || '', street_address: addr.street_address, additional_details: addr.additional_details || '', is_default: addr.is_default,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm(t('msg.confirmDelete'))) return;
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses(prev => prev.filter(a => a.id !== id));
    showToast(t('msg.deleted'), 'success');
  };

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;

  const tabs: { key: AccountTab; label: string; icon: typeof User }[] = [
    { key: 'profile', label: t('label.profile'), icon: User },
    { key: 'orders', label: t('label.orderHistory'), icon: Package },
    { key: 'addresses', label: t('label.myAddresses'), icon: MapPin },
  ];

  return (
    <>
      <SEO title={t('nav.account')} />
      <div className="container-velora py-8">
        <h1 className="text-2xl font-semibold mb-8">{t('nav.account')}</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-stone-900 rounded-lg p-4 product-card-shadow">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-200 dark:border-stone-800">
                <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-stone-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                  <p className="text-xs text-stone-500">{user.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => { signOut(); navigate('/'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('action.signOut')}
                </button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
                <h2 className="font-medium mb-4">{t('label.profile')}</h2>
                <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
                  <Input label={t('label.fullName')} value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
                  <Input label={t('label.phone')} value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                  <Input label={t('label.email')} value={user.email || ''} disabled />
                </div>
                <Button onClick={handleSaveProfile} className="mt-4" disabled={savingProfile}>
                  {savingProfile ? <Spinner size="sm" /> : t('action.save')}
                </Button>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
                <h2 className="font-medium mb-4">{t('label.orderHistory')}</h2>
                {loadingData ? (
                  <Spinner />
                ) : orders.length === 0 ? (
                  <p className="text-sm text-stone-500 py-8 text-center">{t('msg.noOrders')}</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <Link
                        key={order.id}
                        to={`/order-confirmation/${order.order_number}`}
                        className="block p-4 border border-stone-200 dark:border-stone-800 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{order.order_number}</p>
                            <p className="text-xs text-stone-500">{formatDate(order.created_at, lang)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatPrice(order.grand_total, order.currency, lang)}</p>
                            <p className="text-xs capitalize">{order.order_status}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white dark:bg-stone-900 rounded-lg p-6 product-card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium">{t('label.myAddresses')}</h2>
                  <Button size="sm" onClick={() => { setShowAddressForm(!showAddressForm); setEditingAddressId(''); }}>
                    {t('msg.addAddress')}
                  </Button>
                </div>

                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="grid sm:grid-cols-2 gap-4 p-4 border border-stone-200 dark:border-stone-800 rounded-md mb-4">
                    <Input label={t('msg.recipientName')} value={addressForm.recipient_name} onChange={e => setAddressForm(f => ({ ...f, recipient_name: e.target.value }))} required />
                    <Input label={t('label.phone')} value={addressForm.phone} onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))} required />
                    <Input label={t('label.country')} value={addressForm.country} onChange={e => setAddressForm(f => ({ ...f, country: e.target.value }))} required />
                    <Input label={t('label.city')} value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} required />
                    <Input label={t('label.region')} value={addressForm.region} onChange={e => setAddressForm(f => ({ ...f, region: e.target.value }))} />
                    <Input label={t('label.address')} value={addressForm.street_address} onChange={e => setAddressForm(f => ({ ...f, street_address: e.target.value }))} required />
                    <Input label={t('msg.additionalDetails')} value={addressForm.additional_details} onChange={e => setAddressForm(f => ({ ...f, additional_details: e.target.value }))} className="sm:col-span-2" />
                    <label className="flex items-center gap-2 sm:col-span-2">
                      <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm(f => ({ ...f, is_default: e.target.checked }))} />
                      <span className="text-sm">{t('msg.setAsDefault')}</span>
                    </label>
                    <div className="sm:col-span-2 flex gap-2">
                      <Button type="submit" size="sm">{editingAddressId ? t('action.update') : t('action.create')}</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddressForm(false)}>{t('msg.cancel')}</Button>
                    </div>
                  </form>
                )}

                {loadingData ? (
                  <Spinner />
                ) : addresses.length === 0 ? (
                  <p className="text-sm text-stone-500 py-8 text-center">{t('msg.noAddresses')}</p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map(addr => (
                      <div key={addr.id} className="p-4 border border-stone-200 dark:border-stone-800 rounded-md">
                        <div className="flex items-start justify-between">
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{addr.recipient_name}</p>
                              {addr.is_default && <span className="text-xs bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">{t('msg.default')}</span>}
                            </div>
                            <p className="text-stone-500 mt-1">{addr.street_address}, {addr.city}, {addr.country}</p>
                            <p className="text-stone-500">{addr.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditAddress(addr)} className="text-xs text-stone-600 hover:text-stone-900 dark:hover:text-stone-100">{t('msg.edit')}</button>
                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs text-red-500 hover:text-red-600">{t('msg.delete')}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
