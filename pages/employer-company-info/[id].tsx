import { useState, useEffect, useRef, FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { getEmployerInfoApi, saveEmployerInfoApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/companyInfo.module.css';

declare global {
  interface Window {
    google: any;
  }
}

export default function EmployerCompanyInfoPage() {
  const router = useRouter();
  const { id } = router.query;
  const jobId = Number(id);
  const { user } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── State ───────────────────────────────────────
  const [googleKey, setGoogleKey] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailId, setEmailId] = useState('');

  const [interAddress, setInterAddress] = useState('');
  const [interFullAdd, setInterFullAdd] = useState('');
  const [interPincode, setInterPincode] = useState('');
  const [interCountry, setInterCountry] = useState('');
  const [interState, setInterState] = useState('');
  const [interCity, setInterCity] = useState('');
  const [interLat, setInterLat] = useState('');
  const [interLng, setInterLng] = useState('');

  const [receiveAppFrom, setReceiveAppFrom] = useState('Entire City');

  const [sameAddress, setSameAddress] = useState(true);

  const [jobAddress, setJobAddress] = useState('');
  const [jobFullAdd, setJobFullAdd] = useState('');
  const [jobPincode, setJobPincode] = useState('');
  const [jobCountry, setJobCountry] = useState('');
  const [jobState, setJobState] = useState('');
  const [jobCity, setJobCity] = useState('');
  const [jobLat, setJobLat] = useState('');
  const [jobLng, setJobLng] = useState('');

  const interInputRef = useRef<HTMLInputElement>(null);
  const jobInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch Data ──────────────────────────────────
  useEffect(() => {
    if (!jobId || isNaN(jobId)) return;
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const res = await getEmployerInfoApi(jobId);
        if (res.status && res.data) {
          const d = res.data;
          setCompanyName(d.company_name);
          setContactName(d.contact_person_name);
          setPhoneNumber(d.phone_number);
          setEmailId(d.email_id);

          setInterAddress(d.inter_flat_bulding);
          setInterFullAdd(d.inter_full_add);
          setInterPincode(d.inter_pincode);
          setInterCountry(d.inter_country);
          setInterState(d.inter_state);
          setInterCity(d.inter_city);
          setInterLat(d.inter_lat);
          setInterLng(d.inter_lng);

          setReceiveAppFrom(d.recive_application_from || 'Entire City');

          setSameAddress(d.same_address === 1);

          setJobAddress(d.job_flat_bulding);
          setJobFullAdd(d.job_full_add);
          setJobPincode(d.job_pincode);
          setJobCountry(d.job_country);
          setJobState(d.job_state);
          setJobCity(d.job_city);
          setJobLat(d.job_lat);
          setJobLng(d.job_lng);

          setGoogleKey(d.google_geo_key || '');
        } else {
          setError(res.message || 'Failed to load details.');
        }
      } catch (e) {
        setError('Error fetching employer info.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [jobId]);

  // ── Init Google Maps ────────────────────────────
  useEffect(() => {
    if (!loadingData && window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
    }
  }, [loadingData, googleKey]);

  const initAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    const options = { types: ['(regions)'] };

    const parsePlace = (place: any, prefix: 'inter' | 'job') => {
      const location = place.geometry?.location;
      const lat = location ? location.lat().toString() : '';
      const lng = location ? location.lng().toString() : '';
      let pincode='', country='', state='', city='', area='';

      place.address_components?.forEach((c: any) => {
        const type = c.types[0];
        if (type === 'postal_code') pincode = c.short_name;
        if (type === 'country') country = c.long_name;
        if (type === 'administrative_area_level_1') state = c.long_name;
        if (type === 'locality') city = c.long_name;
        if (type === 'sublocality_level_1') area = c.long_name;
      });

      if (prefix === 'inter') {
        setInterFullAdd(place.formatted_address || '');
        setInterLat(lat); setInterLng(lng);
        setInterPincode(pincode); setInterCountry(country); setInterState(state); setInterCity(city);
        
        if (sameAddress) {
          setJobFullAdd(place.formatted_address || '');
          setJobLat(lat); setJobLng(lng);
          setJobPincode(pincode); setJobCountry(country); setJobState(state); setJobCity(city);
        }
      } else {
        setJobFullAdd(place.formatted_address || '');
        setJobLat(lat); setJobLng(lng);
        setJobPincode(pincode); setJobCountry(country); setJobState(state); setJobCity(city);
      }
    };

    if (interInputRef.current) {
      const autocompleteInter = new window.google.maps.places.Autocomplete(interInputRef.current, options);
      window.google.maps.event.clearInstanceListeners(interInputRef.current);
      autocompleteInter.addListener('place_changed', () => parsePlace(autocompleteInter.getPlace(), 'inter'));
    }

    if (jobInputRef.current) {
      const autocompleteJob = new window.google.maps.places.Autocomplete(jobInputRef.current, options);
      window.google.maps.event.clearInstanceListeners(jobInputRef.current);
      autocompleteJob.addListener('place_changed', () => parsePlace(autocompleteJob.getPlace(), 'job'));
    }
  };

  useEffect(() => {
    if (sameAddress) {
      setJobAddress(interAddress);
      setJobFullAdd(interFullAdd);
      setJobPincode(interPincode);
      setJobCountry(interCountry);
      setJobState(interState);
      setJobCity(interCity);
      setJobLat(interLat);
      setJobLng(interLng);
    }
  }, [sameAddress, interAddress, interFullAdd, interPincode, interCountry, interState, interCity, interLat, interLng]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setError('Invalid mobile number');
      return;
    }
    if (!interCountry || !interCity) {
      setError('Please select City, State, Country from the autocomplete dropdown for Interview Address.');
      return;
    }
    if (!sameAddress && (!jobCountry || !jobCity)) {
      setError('Please select City, State, Country from the autocomplete dropdown for Job Address.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const payload = {
        job_id: jobId,
        company_name: companyName,
        contact_person_name: contactName,
        phone_number: phoneNumber,
        email_id: emailId,
        inter_flat_bulding: interAddress,
        inter_full_add: interFullAdd,
        inter_pincode: interPincode,
        inter_country: interCountry,
        inter_state: interState,
        inter_city: interCity,
        inter_lat: interLat,
        inter_lng: interLng,
        recive_application_from: receiveAppFrom,
        same_address: sameAddress ? 1 : 0,
        job_flat_bulding: jobAddress,
        job_full_add: jobFullAdd,
        job_pincode: jobPincode,
        job_country: jobCountry,
        job_state: jobState,
        job_city: jobCity,
        job_lat: jobLat,
        job_lng: jobLng,
      };

      const res = await saveEmployerInfoApi(payload);
      if (res.status) {
        router.push(`/employer-job-reviews/${jobId}`);
      } else {
        setError(res.message || 'Error saving data.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  if(!user || loadingData) return null; // Removed 'Loading...' text fallback

  return (
    <>
      <Head>
        <title>Employer Company Info | NetworkBaba</title>
      </Head>

      {googleKey && (
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places&key=${googleKey}`}
          strategy="afterInteractive"
          onLoad={initAutocomplete}
        />
      )}

      <div className={styles.pageWrapper}>
        <div className={styles.headerBadge}>
          <div className={styles.headerBadgeBtn}>POST JOB</div>
        </div>

        <div className={styles.mainContainer}>
          <form onSubmit={handleSubmit}>
            <div className={styles.card}>
              <div className={styles.cardTitle + ' ' + styles.required}>Interview Information</div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel + ' ' + styles.required}>Company Name</label>
                  <input type="text" className={styles.formInput} value={companyName} onChange={e => setCompanyName(e.target.value)} required style={{textTransform: 'uppercase'}} readOnly={!!companyName} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel + ' ' + styles.required}>Contact Person Name</label>
                  <input type="text" className={styles.formInput} value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Eg. Nilesh HR" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel + ' ' + styles.required}>Contact Number</label>
                  <div>
                    <input type="number" className={styles.formInput} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Contact Number" required />
                    <span className={styles.hintText}>Note: Contact Number on which candidate will call and Whatapp. <img src="/nt/images/icon/whatsapp-button.png" style={{height: 18}} alt="WhatsApp" /></span>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Id</label>
                  <input type="email" className={styles.formInput} value={emailId} onChange={e => setEmailId(e.target.value)} placeholder="Eg. etcsolutions@gmail.com" />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle + ' ' + styles.required}>Address</div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel + ' ' + styles.required}>Interview Address</label>
                  <input type="text" className={styles.formInput} value={interAddress} onChange={e => setInterAddress(e.target.value)} placeholder="Flat No / Plot No /Building Name *" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel + ' ' + styles.required}>City, State, Country</label>
                  <div className={styles.autocompleteContainer}>
                    <input type="text" className={styles.formInput} ref={interInputRef} value={interFullAdd} onChange={e => setInterFullAdd(e.target.value)} required />
                    {interFullAdd && <span className={styles.clearIcon} onClick={() => { setInterFullAdd(''); setInterCountry(''); setInterCity(''); }}>✕</span>}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div></div>
                  <label className={styles.checkboxContainer}>
                    <input type="checkbox" className={styles.checkbox} checked={sameAddress} onChange={e => setSameAddress(e.target.checked)} />
                    <span className={styles.checkboxLabel}>Use Same Address for job</span>
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel + ' ' + styles.required}>Receive Applications From</label>
                  <div className={styles.chipContainer}>
                    {['Within 10km', 'Within 25km', 'Entire City', 'Entire Country', 'Entire World'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.chip} ${receiveAppFrom === opt ? styles.chipActive : ''}`}
                        onClick={() => setReceiveAppFrom(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {!sameAddress && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel + ' ' + styles.required}>Job Address</label>
                      <input type="text" className={styles.formInput} value={jobAddress} onChange={e => setJobAddress(e.target.value)} placeholder="Flat No / Plot No /Building Name *" required={!sameAddress} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel + ' ' + styles.required}>City, State, Country</label>
                      <div className={styles.autocompleteContainer}>
                        <input type="text" className={styles.formInput} ref={jobInputRef} value={jobFullAdd} onChange={e => setJobFullAdd(e.target.value)} required={!sameAddress} />
                        {jobFullAdd && <span className={styles.clearIcon} onClick={() => { setJobFullAdd(''); setJobCountry(''); setJobCity(''); }}>✕</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.submitArea}>
              {error && <span className={styles.errorMsg}>{error}</span>}
              {success && <span style={{color: '#10b981', fontWeight: 600}}>{success}</span>}
              <button type="submit" className={styles.btnSubmit} disabled={saving}>
                Save & Continue ➔
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
