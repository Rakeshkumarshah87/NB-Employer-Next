import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { getPackagesApi, createOrderApi } from '@/services/api';
import DashboardLayout from '@/components/DashboardLayout';
import styles from '@/styles/upgradePlan.module.css';

interface Package {
  id: number;
  package_name: string;
  original_mrp: number;
  package_discount_price: number;
  package_discount_percent: number;
  final_display_price: number;
  extra_discount_applied: boolean;
  is_best_plan: boolean;
  features: string[];
}

export default function EmployerUpgradePlanPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [employerExtraDiscount, setEmployerExtraDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const fetchPackages = async () => {
      try {
        const res = await getPackagesApi();
        if (res.status && res.data) {
          setPackages(res.data.packages || []);
          setEmployerExtraDiscount(res.data.employer_extra_discount_percent || 0);
        } else {
          setError(res.message || 'Failed to load plans');
        }
      } catch (err) {
        setError('Network error loading plans');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPackages();
  }, [user]);

  const handleBuy = async (pkgId: number, amount: number) => {
    try {
      setLoading(true);
      const res = await createOrderApi(pkgId, amount);
      if (res.status && res.data?.db_payment_id) {
        // Redirect to secure payment processor page
        router.push({
          pathname: '/employer-process-payment',
          query: { 
            order_id: res.data.db_payment_id,
            pkg_id: pkgId,
            amount: amount
          }
        });
      } else {
        alert(res.message || 'Error initiating order request.');
        setLoading(false);
      }
    } catch (err) {
      alert('System error initializing order.');
      setLoading(false);
    }
  };

  if (!user) return null;
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.pageContainer}>
          <div className={styles.spinner}></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Upgrade Plan | NetworkBaba</title>
      </Head>

      <div className={styles.pageContainer}>
        {/* Header Label (Single Vacancy only now) */}
        <div className={styles.toggleContainer}>
          <div className={styles.toggleWrapper}>
            <div className={`${styles.toggleBtn} ${styles.toggleBtnActive}`}>
              Single Vacancy
            </div>
            <div className={styles.saveBadge}>Best Price!</div>
          </div>
        </div>

        {/* Exclusive Offer Banner */}
        {employerExtraDiscount > 0 && (
          <div className={styles.bannerContainer}>
            <div className={styles.offerBanner}>
              <h4>🎉 Exclusive Offer Unlocked!</h4>
              <p>You have received a special <b>{employerExtraDiscount}% Discount</b> on all plans.</p>
            </div>
          </div>
        )}

        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>{error}</div>}

        {/* Pricing Cards */}
        <div className={styles.plansGrid}>
          {packages.map((pkg) => (
            <div key={pkg.id} className={styles.pricingCard}>
              
              {pkg.extra_discount_applied ? (
                <div className={styles.specialBadge}>
                  🎁 Special {employerExtraDiscount}% OFF Applied!
                </div>
              ) : pkg.is_best_plan ? (
                <div className={styles.bestPill}>⚡ Best for you</div>
              ) : (pkg.package_discount_price > 0 && pkg.package_discount_price < pkg.original_mrp) ? (
                <div className={styles.discountPill}>🏷️ {pkg.package_discount_percent}% OFF</div>
              ) : null}

              <h3 className={styles.planTitle}>{pkg.package_name}</h3>
              <p className={styles.planSubtitle}>Best for hiring</p>

              <div className={styles.priceWrapper}>
                <span className={styles.currentPrice}>₹{pkg.final_display_price.toLocaleString('en-IN')}</span>
                <span className={styles.perMonth}> / month</span>
              </div>

              <div className={styles.justPayText}>
                Just pay: ₹{pkg.final_display_price.toLocaleString('en-IN')}
                {pkg.final_display_price < pkg.original_mrp && (
                  <span className={styles.strikePrice}>₹{pkg.original_mrp.toLocaleString('en-IN')}</span>
                )}
              </div>

              <button 
                className={`${styles.btnBuy} ${pkg.is_best_plan ? styles.btnGreen : styles.btnBlue}`}
                onClick={() => handleBuy(pkg.id, pkg.final_display_price)}
              >
                Buy Now
              </button>

              <ul className={styles.featuresList}>
                {pkg.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className={pkg.is_best_plan ? styles.iconGreen : styles.iconBlue}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM16.7071 9.70711C17.0976 9.31658 17.0976 8.68342 16.7071 8.29289C16.3166 7.90237 15.6834 7.90237 15.2929 8.29289L10.5 13.0858L8.70711 11.2929C8.31658 10.9024 7.68342 10.9024 7.29289 11.2929C6.90237 11.6834 6.90237 12.3166 7.29289 12.7071L9.79289 15.2071C10.1834 15.5976 10.8166 15.5976 11.2071 15.2071L16.7071 9.70711Z" />
                      </svg>
                    </span> 
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {packages.length === 0 && !error && (
            <div style={{ textAlign: 'center', width: '100%', padding: 40, color: '#666' }}>
              No plans available at the moment.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
