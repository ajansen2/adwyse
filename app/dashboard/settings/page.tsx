'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase-client';
import { Sidebar, MobileNav } from '@/components/dashboard';

interface Store {
  id: string;
  shop_domain: string;
  store_name: string;
  email: string;
  subscription_status: string;
  trial_ends_at: string | null;
}

function SettingsContent() {
  console.log('🔧 SettingsContent component rendering...');
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncingTikTok, setSyncingTikTok] = useState(false);
  const [emailReportFrequency, setEmailReportFrequency] = useState<'none' | 'weekly' | 'monthly'>('none');
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [roasAlertEnabled, setRoasAlertEnabled] = useState(false);
  const [roasThreshold, setRoasThreshold] = useState(1.5);
  const [spendAlertEnabled, setSpendAlertEnabled] = useState(false);
  const [spendThreshold, setSpendThreshold] = useState(100);
  const [savingAlertSettings, setSavingAlertSettings] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [sendingTestAlert, setSendingTestAlert] = useState(false);
  const [testAlertSent, setTestAlertSent] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'trial' | 'pro'>('pro');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [pixelCopied, setPixelCopied] = useState(false);
  const [pixelVerifying, setPixelVerifying] = useState(false);
  const [pixelVerified, setPixelVerified] = useState<boolean | null>(null);
  const [attributionModel, setAttributionModel] = useState<'last_click' | 'first_click' | 'linear' | 'time_decay' | 'position_based'>('last_click');
  const [savingAttributionModel, setSavingAttributionModel] = useState(false);
  // Slack integration state
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackDailySummary, setSlackDailySummary] = useState(false);
  const [savingSlackSettings, setSavingSlackSettings] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  // Meta CAPI state
  const [capiEnabled, setCapiEnabled] = useState(false);
  const [capiPixelId, setCapiPixelId] = useState('');
  const [capiToken, setCapiToken] = useState('');
  const [capiTestCode, setCapiTestCode] = useState('');
  const [savingCapi, setSavingCapi] = useState(false);
  const [testingCapi, setTestingCapi] = useState(false);
  const [capiTestResult, setCapiTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sendingTestPixel, setSendingTestPixel] = useState(false);
  const [testPixelSent, setTestPixelSent] = useState(false);
  // Demo data state
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [clearingDemo, setClearingDemo] = useState(false);
  const [demoDataCounts, setDemoDataCounts] = useState<{ orders: number; campaigns: number; pixelEvents: number } | null>(null);
  // Goals state
  const [revenueGoal, setRevenueGoal] = useState<number | ''>('');
  const [ordersGoal, setOrdersGoal] = useState<number | ''>('');
  const [roasGoal, setRoasGoal] = useState<number | ''>('');
  const [goalPeriod, setGoalPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [savingGoals, setSavingGoals] = useState(false);
  const supabase = getSupabaseClient();

  // Get URL params directly from window.location (more reliable in iframes)
  const getUrlParam = (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  // Check for OAuth callback messages and upgrade param
  useEffect(() => {
    const success = getUrlParam('success');
    const error = getUrlParam('error');
    const upgrade = getUrlParam('upgrade');

    if (success === 'facebook_connected') {
      setSuccessMessage('Facebook Ads account connected successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (success === 'google_connected') {
      setSuccessMessage('Google Ads account connected successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (success === 'tiktok_connected') {
      setSuccessMessage('TikTok Ads account connected successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (error) {
      setErrorMessage(`Failed to connect: ${error.replace(/_/g, ' ')}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }

    // If upgrade=true, show the upgrade modal
    if (upgrade === 'true') {
      setShowUpgradeModal(true);
    }
  }, []);

  useEffect(() => {
    const loadStore = async () => {
      console.log('🔧 Settings: Starting loadStore...');
      try {
        const shop = getUrlParam('shop');
        console.log('🔧 Settings: shop param =', shop);

        if (!shop) {
          console.log('🔧 Settings: No shop param, setting loading to false');
          setLoading(false);
          return;
        }

        // Use synchronous XHR (works better in Shopify iframe than fetch)
        console.log('🔧 Settings: Fetching store lookup via XHR...');
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/stores/lookup?shop=${encodeURIComponent(shop)}`, false);
        xhr.send();
        console.log('🔧 Settings: XHR response status:', xhr.status);

        if (xhr.status !== 200) {
          console.error('🔧 Settings: Store lookup failed:', xhr.status);
          setLoading(false);
          return;
        }

        const data = JSON.parse(xhr.responseText);
        console.log('🔧 Settings: Store data received:', data.store ? 'yes' : 'no');

        if (data.store) {
          console.log('🔧 Settings: Setting store, id =', data.store.id);
          setStore(data.store);

          // Load ad accounts
          console.log('🔧 Settings: Loading ad accounts...');
          const { data: accounts } = await supabase
            .from('ad_accounts')
            .select('*')
            .eq('store_id', data.store.id);

          if (accounts) {
            console.log('🔧 Settings: Setting ad accounts, count:', accounts.length);
            setAdAccounts(accounts);
          }

          // Load email report settings via XHR (works better in iframe)
          try {
            console.log('🔧 Settings: Loading report settings via XHR...');
            const reportXhr = new XMLHttpRequest();
            reportXhr.open('GET', `/api/reports/settings?store_id=${data.store.id}`, false);
            reportXhr.send();
            if (reportXhr.status === 200) {
              const reportData = JSON.parse(reportXhr.responseText);
              setEmailReportFrequency(reportData.frequency || 'none');
              console.log('🔧 Settings: Report settings loaded:', reportData.frequency);
            }
          } catch (err) {
            console.error('Error loading email settings:', err);
          }

          // Load alert settings via XHR
          try {
            console.log('🔧 Settings: Loading alert settings via XHR...');
            const alertXhr = new XMLHttpRequest();
            alertXhr.open('GET', `/api/alerts/settings?store_id=${data.store.id}`, false);
            alertXhr.send();
            if (alertXhr.status === 200) {
              const alertData = JSON.parse(alertXhr.responseText);
              setRoasAlertEnabled(alertData.roas_alert_enabled || false);
              setRoasThreshold(alertData.roas_threshold || 1.5);
              setSpendAlertEnabled(alertData.spend_alert_enabled || false);
              setSpendThreshold(alertData.spend_threshold || 100);
              console.log('🔧 Settings: Alert settings loaded');
            }
          } catch (err) {
            console.error('Error loading alert settings:', err);
          }

          // Load subscription tier
          try {
            console.log('🔧 Settings: Loading subscription tier via XHR...');
            const tierXhr = new XMLHttpRequest();
            let tierUrl = `/api/me/tier?store_id=${data.store.id}`;
            const ft = new URLSearchParams(window.location.search).get('force_tier');
            if (ft) tierUrl += `&force_tier=${ft}`;
            tierXhr.open('GET', tierUrl, false);
            tierXhr.send();
            if (tierXhr.status === 200) {
              const tierData = JSON.parse(tierXhr.responseText);
              setSubscriptionTier(tierData.tier || 'pro');
              console.log('🔧 Settings: Subscription tier:', tierData.tier);
            }
          } catch (err) {
            console.error('Error loading subscription tier:', err);
          }

          // Load Slack settings via XHR
          try {
            console.log('🔧 Settings: Loading Slack settings via XHR...');
            const slackXhr = new XMLHttpRequest();
            slackXhr.open('GET', `/api/slack/settings?store_id=${data.store.id}`, false);
            slackXhr.send();
            if (slackXhr.status === 200) {
              const slackData = JSON.parse(slackXhr.responseText);
              setSlackEnabled(slackData.enabled || false);
              setSlackWebhookUrl(slackData.webhookUrl || '');
              setSlackDailySummary(slackData.dailySummary || false);
              console.log('🔧 Settings: Slack settings loaded:', slackData.enabled);
            }
          } catch (err) {
            console.error('Error loading Slack settings:', err);
          }

          // Load Meta CAPI settings
          try {
            const capiXhr = new XMLHttpRequest();
            capiXhr.open('GET', `/api/meta-capi/settings?store_id=${data.store.id}`, false);
            capiXhr.send();
            if (capiXhr.status === 200) {
              const c = JSON.parse(capiXhr.responseText);
              setCapiEnabled(c.enabled || false);
              setCapiPixelId(c.pixelId || '');
              setCapiToken(c.tokenMasked || '');
              setCapiTestCode(c.testCode || '');
            }
          } catch (err) {
            console.error('Error loading CAPI settings:', err);
          }

          // Load attribution model
          try {
            console.log('🔧 Settings: Loading attribution model via XHR...');
            const attrXhr = new XMLHttpRequest();
            attrXhr.open('GET', `/api/settings/attribution?store_id=${data.store.id}`, false);
            attrXhr.send();
            if (attrXhr.status === 200) {
              const attrData = JSON.parse(attrXhr.responseText);
              setAttributionModel(attrData.attribution_model || 'last_click');
              console.log('🔧 Settings: Attribution model:', attrData.attribution_model);
            }
          } catch (err) {
            console.error('Error loading attribution model:', err);
          }

          // Load goals
          try {
            console.log('🔧 Settings: Loading goals via XHR...');
            const goalsXhr = new XMLHttpRequest();
            goalsXhr.open('GET', `/api/goals?store_id=${data.store.id}`, false);
            goalsXhr.send();
            if (goalsXhr.status === 200) {
              const goalsData = JSON.parse(goalsXhr.responseText);
              const goals = goalsData.goals || [];
              goals.forEach((goal: any) => {
                if (goal.goal_type === 'revenue') setRevenueGoal(goal.target_value);
                if (goal.goal_type === 'orders') setOrdersGoal(goal.target_value);
                if (goal.goal_type === 'roas') setRoasGoal(goal.target_value);
                setGoalPeriod(goal.period || 'monthly');
              });
              console.log('🔧 Settings: Goals loaded:', goals.length);
            }
          } catch (err) {
            console.error('Error loading goals:', err);
          }
        } else {
          console.log('🔧 Settings: No store in response data');
        }
      } catch (error) {
        console.error('🔧 Settings: Error loading store:', error);
      } finally {
        console.log('🔧 Settings: Setting loading to false (finally block)');
        setLoading(false);
      }
    };

    loadStore();
  }, [supabase]);

  const handleSaveAlertSettings = () => {
    if (!store) return;

    setSavingAlertSettings(true);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/alerts/settings', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        storeId: store.id,
        roas_alert_enabled: roasAlertEnabled,
        roas_threshold: roasThreshold,
        spend_alert_enabled: spendAlertEnabled,
        spend_threshold: spendThreshold,
      }));

      if (xhr.status === 200) {
        setSuccessMessage('Alert settings saved');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to save alert settings');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving alert settings:', error);
      setErrorMessage('Failed to save alert settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingAlertSettings(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!store) return;

    setSavingGoals(true);
    try {
      const goalsToSave = [];
      if (revenueGoal !== '' && revenueGoal > 0) {
        goalsToSave.push({ goalType: 'revenue', targetValue: revenueGoal, period: goalPeriod });
      }
      if (ordersGoal !== '' && ordersGoal > 0) {
        goalsToSave.push({ goalType: 'orders', targetValue: ordersGoal, period: goalPeriod });
      }
      if (roasGoal !== '' && roasGoal > 0) {
        goalsToSave.push({ goalType: 'roas', targetValue: roasGoal, period: goalPeriod });
      }

      for (const goal of goalsToSave) {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: store.id,
            ...goal,
          }),
        });
      }

      setSuccessMessage('Goals saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving goals:', error);
      setErrorMessage('Failed to save goals');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingGoals(false);
    }
  };

  const handleSaveSlackSettings = () => {
    if (!store) return;

    // Validate webhook URL if enabling
    if (slackEnabled && slackWebhookUrl && !slackWebhookUrl.startsWith('https://hooks.slack.com/')) {
      setErrorMessage('Invalid Slack webhook URL. Must start with https://hooks.slack.com/');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setSavingSlackSettings(true);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/slack/settings', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        storeId: store.id,
        enabled: slackEnabled,
        webhookUrl: slackWebhookUrl,
        dailySummary: slackDailySummary,
      }));

      if (xhr.status === 200) {
        setSuccessMessage(slackEnabled ? 'Slack integration enabled' : 'Slack settings saved');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = JSON.parse(xhr.responseText);
        setErrorMessage(data.error || 'Failed to save Slack settings');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error saving Slack settings:', error);
      setErrorMessage('Failed to save Slack settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingSlackSettings(false);
    }
  };

  const handleTestSlack = () => {
    if (!store || !slackWebhookUrl) return;

    setTestingSlack(true);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/slack/settings', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        storeId: store.id,
        enabled: true,
        webhookUrl: slackWebhookUrl,
        dailySummary: slackDailySummary,
      }));

      if (xhr.status === 200) {
        setSlackEnabled(true);
        setSuccessMessage('Slack connected! Check your channel for a test message.');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const data = JSON.parse(xhr.responseText);
        setErrorMessage(data.error || 'Failed to connect Slack');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error testing Slack:', error);
      setErrorMessage('Failed to test Slack webhook');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setTestingSlack(false);
    }
  };

  const handleSaveCapi = async () => {
    if (!store) return;
    setSavingCapi(true);
    setCapiTestResult(null);
    try {
      const res = await fetch('/api/meta-capi/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          enabled: capiEnabled,
          pixelId: capiPixelId,
          token: capiToken,
          testCode: capiTestCode,
        }),
      });
      if (res.ok) {
        setSuccessMessage('Meta CAPI settings saved');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const d = await res.json().catch(() => ({}));
        setErrorMessage(d.error || 'Failed to save CAPI settings');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (err) {
      setErrorMessage('Failed to save CAPI settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingCapi(false);
    }
  };

  const handleTestCapi = async () => {
    if (!store) return;
    setTestingCapi(true);
    setCapiTestResult(null);
    try {
      const res = await fetch('/api/meta-capi/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCapiTestResult({
          ok: true,
          msg: data.message || 'Test event sent. Check Meta Events Manager.',
        });
      } else {
        setCapiTestResult({
          ok: false,
          msg: data.error || 'Test failed',
        });
      }
    } catch (err: any) {
      setCapiTestResult({ ok: false, msg: err?.message || 'Test failed' });
    } finally {
      setTestingCapi(false);
    }
  };

  const handleSaveEmailSettings = (frequency: 'none' | 'weekly' | 'monthly') => {
    if (!store) return;

    setSavingEmailSettings(true);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/reports/settings', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ storeId: store.id, frequency }));

      if (xhr.status === 200) {
        setEmailReportFrequency(frequency);
        setSuccessMessage(`Email reports ${frequency === 'none' ? 'disabled' : `set to ${frequency}`}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to update email settings');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setErrorMessage('Failed to update email settings');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!store) return;

    setSendingTestEmail(true);
    setTestEmailSent(false);
    try {
      const response = await fetch('/api/reports/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: store.email || 'adam@adwyse.ca',
          storeName: store.store_name,
          shopDomain: store.shop_domain
        }),
      });

      if (response.ok) {
        setTestEmailSent(true);
        setSuccessMessage('Test email sent! Check your inbox.');
        setTimeout(() => {
          setSuccessMessage('');
          setTestEmailSent(false);
        }, 5000);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to send test email');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setErrorMessage('Failed to send test email');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSendTestAlert = async (alertType: 'low_roas' | 'high_spend') => {
    if (!store) return;

    setSendingTestAlert(true);
    setTestAlertSent(false);
    try {
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: store.email || 'adam@adwyse.ca',
          storeName: store.store_name,
          shopDomain: store.shop_domain,
          alertType
        }),
      });

      if (response.ok) {
        setTestAlertSent(true);
        setSuccessMessage(`Test ${alertType === 'low_roas' ? 'ROAS' : 'Spend'} alert sent! Check your inbox.`);
        setTimeout(() => {
          setSuccessMessage('');
          setTestAlertSent(false);
        }, 5000);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to send test alert');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error sending test alert:', error);
      setErrorMessage('Failed to send test alert');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSendingTestAlert(false);
    }
  };

  const handleUpgrade = async () => {
    if (!store) return;

    setUpgrading(true);
    try {
      const shop = getUrlParam('shop');
      const response = await fetch('/api/billing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id, shop })
      });

      const data = await response.json();

      if (data.confirmationUrl) {
        // Redirect to Shopify billing approval page
        window.top?.location.assign(data.confirmationUrl);
      } else if (data.status === 'active') {
        setSuccessMessage('You already have an active Pro subscription!');
        setShowUpgradeModal(false);
        setSubscriptionTier('pro');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to create billing charge');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error creating billing charge:', error);
      setErrorMessage('Failed to start upgrade process');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUpgrading(false);
    }
  };

  const handleCopyPixelCode = () => {
    if (!store) return;
    const pixelCode = `<script src="${window.location.origin}/api/pixel/script/${store.id}" async></script>`;
    navigator.clipboard.writeText(pixelCode);
    setPixelCopied(true);
    setTimeout(() => setPixelCopied(false), 3000);
  };

  const handleVerifyPixel = async () => {
    if (!store) return;
    setPixelVerifying(true);
    setPixelVerified(null);

    try {
      const response = await fetch(`/api/pixel/verify?store_id=${store.id}`);
      const data = await response.json();
      setPixelVerified(data.verified || false);
    } catch {
      setPixelVerified(false);
    } finally {
      setPixelVerifying(false);
    }
  };

  const handleSendTestPixel = async () => {
    if (!store) return;
    setSendingTestPixel(true);
    setTestPixelSent(false);

    try {
      const testPayload = {
        storeId: store.id,
        eventType: 'test_event',
        visitorId: 'test_' + Date.now().toString(36),
        sessionId: 'test_session_' + Date.now().toString(36),
        pageUrl: window.location.href,
        pageTitle: 'AdWyse Settings - Test Event',
        userAgent: navigator.userAgent,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        clientTimestamp: new Date().toISOString()
      };

      const response = await fetch('/api/pixel/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        setTestPixelSent(true);
        setSuccessMessage('Test event sent! Click "Verify Installation" to confirm.');
        setTimeout(() => {
          setSuccessMessage('');
          setTestPixelSent(false);
        }, 5000);
      } else {
        setErrorMessage('Failed to send test event');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error sending test pixel:', error);
      setErrorMessage('Failed to send test event');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSendingTestPixel(false);
    }
  };

  const handleSaveAttributionModel = () => {
    if (!store) return;

    setSavingAttributionModel(true);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/settings/attribution', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({
        storeId: store.id,
        attribution_model: attributionModel,
      }));

      if (xhr.status === 200) {
        setSuccessMessage('Attribution model saved');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to save attribution model');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving attribution model:', error);
      setErrorMessage('Failed to save attribution model');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSavingAttributionModel(false);
    }
  };

  const handleConnectFacebook = () => {
    if (!store) return;
    // Open in new window because Facebook blocks OAuth in iframes
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      `/api/auth/facebook?store_id=${store.id}`,
      'Facebook OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  // Listen for message from OAuth popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'facebook_connected') {
        if (event.data.success) {
          setSuccessMessage('Facebook Ads account connected successfully!');
          window.location.reload();
        } else {
          setErrorMessage('Failed to connect Facebook account');
        }
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 5000);
      }

      if (event.data?.type === 'google_connected') {
        if (event.data.success) {
          setSuccessMessage('Google Ads account connected successfully!');
          window.location.reload();
        } else {
          setErrorMessage('Failed to connect Google Ads account');
        }
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 5000);
      }

      if (event.data?.type === 'tiktok_connected') {
        if (event.data.success) {
          setSuccessMessage('TikTok Ads account connected successfully!');
          window.location.reload();
        } else {
          setErrorMessage('Failed to connect TikTok Ads account');
        }
        setTimeout(() => {
          setSuccessMessage('');
          setErrorMessage('');
        }, 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectTikTok = () => {
    if (!store) return;
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      `/api/auth/tiktok?store_id=${store.id}`,
      'TikTok OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleSyncTikTok = async () => {
    if (!store || syncingTikTok) return;

    setSyncingTikTok(true);

    try {
      const apiUrl = window.location.origin + '/api/sync/tiktok';

      const result = await new Promise<{ok: boolean, status: number, data: any}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 30000;

        xhr.onload = function() {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
          } catch (e) {
            resolve({ ok: false, status: xhr.status, data: { error: 'Failed to parse response' } });
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error - request failed'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.send(JSON.stringify({ storeId: store.id }));
      });

      if (result.ok) {
        setSuccessMessage(result.data.message || 'TikTok Ads campaigns synced successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(result.data.error || 'Failed to sync TikTok Ads campaigns');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to sync TikTok Ads campaigns');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSyncingTikTok(false);
    }
  };

  const handleConnectGoogle = () => {
    if (!store) return;
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      `/api/auth/google?store_id=${store.id}`,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleSyncGoogle = async () => {
    if (!store || syncingGoogle) return;

    setSyncingGoogle(true);

    try {
      const apiUrl = window.location.origin + '/api/sync/google';

      const result = await new Promise<{ok: boolean, status: number, data: any}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 30000;

        xhr.onload = function() {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
          } catch (e) {
            resolve({ ok: false, status: xhr.status, data: { error: 'Failed to parse response' } });
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error - request failed'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.send(JSON.stringify({ storeId: store.id }));
      });

      if (result.ok) {
        setSuccessMessage(result.data.message || 'Google Ads campaigns synced successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(result.data.error || 'Failed to sync Google Ads campaigns');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to sync Google Ads campaigns');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSyncingGoogle(false);
    }
  };

  const handleSyncFacebook = async () => {
    if (!store) {
      setErrorMessage('Store not loaded. Please refresh the page.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (syncing) return;

    setSyncing(true);

    try {
      const apiUrl = window.location.origin + '/api/sync/facebook';

      // Use XMLHttpRequest for better compatibility with Shopify iframe
      const result = await new Promise<{ok: boolean, status: number, data: any}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 30000; // 30 second timeout

        xhr.onload = function() {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
          } catch (e) {
            resolve({ ok: false, status: xhr.status, data: { error: 'Failed to parse response' } });
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error - request failed'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.send(JSON.stringify({ storeId: store.id }));
      });

      if (result.ok) {
        setSuccessMessage(result.data.message || 'Facebook campaigns synced successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(result.data.error || 'Failed to sync Facebook campaigns');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to sync Facebook campaigns');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  // Demo data handlers
  const checkDemoData = async () => {
    if (!store) return;
    try {
      const response = await fetch(`/api/demo/seed?store_id=${store.id}`);
      const data = await response.json();
      if (data.counts) {
        setDemoDataCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to check demo data:', error);
    }
  };

  const handleSeedDemoData = async () => {
    if (!store) return;
    setSeedingDemo(true);
    try {
      const response = await fetch(`/api/demo/seed?store_id=${store.id}&days=60&orders=150`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage(`Demo data seeded: ${data.results.orders} orders, ${data.results.campaigns} campaign days, ${data.results.pixelEvents} pixel events`);
        setTimeout(() => setSuccessMessage(''), 8000);
        checkDemoData();
      } else {
        setErrorMessage(data.error || 'Failed to seed demo data');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to seed demo data');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSeedingDemo(false);
    }
  };

  const handleClearDemoData = async () => {
    if (!store) return;
    if (!confirm('Are you sure you want to clear all demo data? This cannot be undone.')) return;
    setClearingDemo(true);
    try {
      const response = await fetch(`/api/demo/seed?store_id=${store.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Demo data cleared successfully');
        setTimeout(() => setSuccessMessage(''), 5000);
        setDemoDataCounts(null);
      } else {
        setErrorMessage(data.error || 'Failed to clear demo data');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to clear demo data');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setClearingDemo(false);
    }
  };

  // Check demo data on load
  useEffect(() => {
    if (store) {
      checkDemoData();
    }
  }, [store]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <div className="text-white text-xl">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      <Sidebar activePage="settings" />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <header className="bg-slate-900/50 backdrop-blur border-b border-white/10 sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
        </header>

        <div className="p-6 max-w-4xl">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Upgrade Modal */}
          {showUpgradeModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-white/20 rounded-2xl max-w-lg w-full p-8 relative">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
                  <p className="text-white/60">Unlock the full power of AdWyse</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    'Unlimited orders & data history',
                    'Unlimited ad accounts',
                    'AI Assistant (Ask AdWyse)',
                    'Competitor Spy (live ads)',
                    'AI Creative Score (0-100)',
                    'Cohort Retention Analysis',
                    'New vs Repeat ROAS',
                    'Predictive Budget Optimizer',
                    'Multi-touch Attribution',
                    'Server-side CAPI',
                    'Slack Daily Digest',
                    'Email Reports & Alerts',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-white text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-white">
                    $99.99
                    <span className="text-lg font-normal text-white/60">/month</span>
                  </div>
                  <p className="text-white/40 text-sm mt-1">7-day free trial · Cancel anytime</p>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-orange-800 disabled:to-red-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  {upgrading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-white/40 text-xs text-center mt-4">
                  Billed through Shopify. Secure payment processing.
                </p>
              </div>
            </div>
          )}

          {/* Free Tier Upgrade Banner */}
          {subscriptionTier === 'free' && !showUpgradeModal && (
            <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">You&apos;re on the Free Plan</h3>
                    <p className="text-amber-100/80 text-sm">
                      Upgrade to Pro for unlimited tracking, AI insights, and more.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition flex items-center gap-2"
                >
                  Upgrade to Pro
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-white/60 text-sm">Store Name</label>
                <div className="text-white font-medium">{store?.store_name || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Shop Domain</label>
                <div className="text-white font-medium">{store?.shop_domain || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Email</label>
                <div className="text-white font-medium">{store?.email || 'N/A'}</div>
              </div>
              <div>
                <label className="text-white/60 text-sm">Subscription Status</label>
                <div className="flex items-center gap-2">
                  {(() => {
                    if (subscriptionTier === 'free') {
                      return (
                        <>
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-zinc-500/20 text-zinc-300">
                            Free Plan
                          </span>
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-full transition"
                          >
                            Upgrade
                          </button>
                        </>
                      );
                    }

                    if (subscriptionTier === 'trial' && store?.trial_ends_at) {
                      const trialEnd = new Date(store.trial_ends_at);
                      const now = new Date();
                      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300">
                          Pro Trial <span className="text-yellow-300 ml-1">({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)</span>
                        </span>
                      );
                    }

                    return (
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300">
                        Pro Plan - Active
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Ad Connections */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Ad Account Connections</h2>
            <p className="text-white/60 mb-6">
              Connect your ad accounts to automatically sync campaign spend data and calculate ROAS.
            </p>

            {subscriptionTier === 'free' && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-orange-300 text-sm">
                  Free plan: 1 ad account maximum.{' '}
                  {adAccounts.filter(a => a.is_connected).length >= 1 && (
                    <span className="text-orange-400 font-medium">Limit reached — </span>
                  )}
                  <a
                    href="/pricing"
                    className="text-orange-400 underline hover:text-orange-300"
                  >
                    Upgrade to Pro
                  </a>
                  {' '}for unlimited accounts.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Facebook Ads */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium">Facebook Ads</div>
                      <div className="text-white/40 text-sm">
                        {adAccounts.filter(a => a.platform === 'facebook').length > 0
                          ? `${adAccounts.filter(a => a.platform === 'facebook').length} account(s) connected`
                          : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {adAccounts.filter(a => a.platform === 'facebook').length > 0 && (
                      <button
                        onClick={handleSyncFacebook}
                        disabled={syncing}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        {syncing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Syncing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleConnectFacebook}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                    >
                      {adAccounts.filter(a => a.platform === 'facebook').length > 0 ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* Connected Facebook Accounts */}
                {adAccounts.filter(a => a.platform === 'facebook').length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {adAccounts.filter(a => a.platform === 'facebook').map((account) => (
                      <div key={account.id} className="flex items-center justify-between text-sm">
                        <div className="text-white/70">{account.account_name || `Account ${account.account_id}`}</div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          account.is_connected
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {account.is_connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Google Ads */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium">Google Ads</div>
                      <div className="text-white/40 text-sm">
                        {adAccounts.filter(a => a.platform === 'google').length > 0
                          ? `${adAccounts.filter(a => a.platform === 'google').length} account(s) connected`
                          : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {adAccounts.filter(a => a.platform === 'google').length > 0 && (
                      <button
                        onClick={handleSyncGoogle}
                        disabled={syncingGoogle}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        {syncingGoogle ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Syncing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleConnectGoogle}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                    >
                      {adAccounts.filter(a => a.platform === 'google').length > 0 ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* Connected Google Accounts */}
                {adAccounts.filter(a => a.platform === 'google').length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {adAccounts.filter(a => a.platform === 'google').map((account) => (
                      <div key={account.id} className="flex items-center justify-between text-sm">
                        <div className="text-white/70">{account.account_name || `Account ${account.account_id}`}</div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          account.is_connected
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {account.is_connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TikTok Ads */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium">TikTok Ads</div>
                      <div className="text-white/40 text-sm">
                        {adAccounts.filter(a => a.platform === 'tiktok').length > 0
                          ? `${adAccounts.filter(a => a.platform === 'tiktok').length} account(s) connected`
                          : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {adAccounts.filter(a => a.platform === 'tiktok').length > 0 && (
                      <button
                        onClick={handleSyncTikTok}
                        disabled={syncingTikTok}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        {syncingTikTok ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Syncing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleConnectTikTok}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition"
                    >
                      {adAccounts.filter(a => a.platform === 'tiktok').length > 0 ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

                {/* Connected TikTok Accounts */}
                {adAccounts.filter(a => a.platform === 'tiktok').length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {adAccounts.filter(a => a.platform === 'tiktok').map((account) => (
                      <div key={account.id} className="flex items-center justify-between text-sm">
                        <div className="text-white/70">{account.account_name || `Account ${account.account_id}`}</div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          account.is_connected
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {account.is_connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tracking Pixel Installation */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tracking Pixel</h2>
                <p className="text-white/60 text-sm">First-party tracking that bypasses ad blockers</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 rounded-lg border border-white/10 mb-4">
              <p className="text-white/70 text-sm mb-3">
                Add this code to your Shopify theme&apos;s <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-300">theme.liquid</code> file,
                just before the closing <code className="px-1.5 py-0.5 bg-white/10 rounded text-cyan-300">&lt;/head&gt;</code> tag:
              </p>
              <div className="relative">
                <pre className="p-4 bg-black/50 rounded-lg text-green-400 text-sm font-mono overflow-x-auto">
{`<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/pixel/script/${store?.id || 'YOUR_STORE_ID'}" async></script>`}
                </pre>
                <button
                  onClick={handleCopyPixelCode}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition flex items-center gap-2"
                >
                  {pixelCopied ? (
                    <>
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleVerifyPixel}
                disabled={pixelVerifying}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {pixelVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verify Installation
                  </>
                )}
              </button>

              <button
                onClick={handleSendTestPixel}
                disabled={sendingTestPixel}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {sendingTestPixel ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : testPixelSent ? (
                  <>
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Test Sent!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Send Test Event
                  </>
                )}
              </button>
            </div>

            {pixelVerified !== null && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${pixelVerified ? 'text-green-400' : 'text-red-400'}`}>
                {pixelVerified ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pixel is active and tracking!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Pixel not detected. Send a test event or install the pixel on your store.
                  </>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/10">
              <h3 className="text-white font-medium mb-2">What this pixel tracks:</h3>
              <ul className="grid grid-cols-2 gap-2 text-white/60 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                  Page views
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                  Add to cart events
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                  UTM parameters
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                  Click IDs (fbclid, gclid, ttclid)
                </li>
              </ul>
            </div>
          </div>

          {/* Attribution Model */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Attribution Model</h2>
                <p className="text-white/60 text-sm">Choose how conversion credit is distributed across touchpoints</p>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                { id: 'last_click', name: 'Last Click', desc: '100% credit to the final touchpoint before conversion' },
                { id: 'first_click', name: 'First Click', desc: '100% credit to the first touchpoint that started the journey' },
                { id: 'linear', name: 'Linear', desc: 'Equal credit distributed across all touchpoints' },
                { id: 'time_decay', name: 'Time Decay', desc: 'More credit to touchpoints closer to conversion' },
                { id: 'position_based', name: 'Position Based', desc: '40% first, 40% last, 20% distributed to middle' },
              ].map((model) => (
                <button
                  key={model.id}
                  onClick={() => setAttributionModel(model.id as typeof attributionModel)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    attributionModel === model.id
                      ? 'bg-indigo-600/20 border-indigo-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{model.name}</div>
                      <div className="text-white/50 text-sm">{model.desc}</div>
                    </div>
                    {attributionModel === model.id && (
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveAttributionModel}
              disabled={savingAttributionModel}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
            >
              {savingAttributionModel ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Attribution Model'
              )}
            </button>
          </div>

          {/* Email Reports */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Email Reports</h2>
                <p className="text-white/60 text-sm">Get performance summaries delivered to your inbox</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSaveEmailSettings('none')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'none'
                    ? 'bg-orange-600/20 border-orange-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Off</div>
                <div className="text-xs opacity-60">No emails</div>
              </button>

              <button
                onClick={() => handleSaveEmailSettings('weekly')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'weekly'
                    ? 'bg-orange-600/20 border-orange-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Weekly</div>
                <div className="text-xs opacity-60">Every Monday</div>
              </button>

              <button
                onClick={() => handleSaveEmailSettings('monthly')}
                disabled={savingEmailSettings}
                className={`p-4 rounded-lg border-2 transition ${
                  emailReportFrequency === 'monthly'
                    ? 'bg-orange-600/20 border-orange-500 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="font-medium mb-1">Monthly</div>
                <div className="text-xs opacity-60">1st of month</div>
              </button>
            </div>

            {savingEmailSettings && (
              <div className="mt-3 text-white/60 text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            )}

            {/* Send Test Email Button */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={handleSendTestEmail}
                disabled={sendingTestEmail}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {sendingTestEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : testEmailSent ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sent!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Test Email
                  </>
                )}
              </button>
              <p className="text-white/40 text-xs mt-2">Send a sample report to {store?.email || 'your email'}</p>
            </div>
          </div>

          {/* Performance Alerts */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Performance Alerts</h2>
                <p className="text-white/60 text-sm">Get notified when campaigns need attention</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* ROAS Alert */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">Low ROAS Alert</div>
                    <div className="text-white/40 text-sm">Alert when ROAS drops below threshold</div>
                  </div>
                  <button
                    onClick={() => setRoasAlertEnabled(!roasAlertEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      roasAlertEnabled ? 'bg-orange-600' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      roasAlertEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                {roasAlertEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm">Alert when ROAS below:</span>
                    <input
                      type="number"
                      value={roasThreshold}
                      onChange={(e) => setRoasThreshold(parseFloat(e.target.value) || 0)}
                      step="0.1"
                      min="0"
                      className="w-20 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <span className="text-white/60 text-sm">x</span>
                  </div>
                )}
              </div>

              {/* Spend Alert */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">High Spend Alert</div>
                    <div className="text-white/40 text-sm">Alert when daily spend exceeds budget</div>
                  </div>
                  <button
                    onClick={() => setSpendAlertEnabled(!spendAlertEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      spendAlertEnabled ? 'bg-orange-600' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      spendAlertEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                {spendAlertEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm">Alert when daily spend exceeds:</span>
                    <span className="text-white/60">$</span>
                    <input
                      type="number"
                      value={spendThreshold}
                      onChange={(e) => setSpendThreshold(parseFloat(e.target.value) || 0)}
                      step="10"
                      min="0"
                      className="w-24 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveAlertSettings}
                disabled={savingAlertSettings}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {savingAlertSettings ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Alert Settings'
                )}
              </button>

              {/* Test Alert Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleSendTestAlert('low_roas')}
                  disabled={sendingTestAlert}
                  className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  {sendingTestAlert ? (
                    <div className="w-3 h-3 border-2 border-red-300 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>📉</span>
                  )}
                  Test ROAS Alert
                </button>
                <button
                  onClick={() => handleSendTestAlert('high_spend')}
                  disabled={sendingTestAlert}
                  className="px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  {sendingTestAlert ? (
                    <div className="w-3 h-3 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>💸</span>
                  )}
                  Test Spend Alert
                </button>
              </div>
              <p className="text-white/40 text-xs mt-2">Send a sample alert to {store?.email || 'your email'}</p>
            </div>
          </div>

          {/* Goals & Targets */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Goals & Targets</h2>
                <p className="text-white/60 text-sm">Set performance goals to track your progress</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Goal Period Selection */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white/60 text-sm">Goal period:</span>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setGoalPeriod(period)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        goalPeriod === period
                          ? 'bg-green-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Revenue Goal */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-white font-medium">Revenue Goal</span>
                    </div>
                    <div className="text-white/40 text-sm">Target revenue per {goalPeriod}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">$</span>
                    <input
                      type="number"
                      value={revenueGoal}
                      onChange={(e) => setRevenueGoal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="10000"
                      className="w-28 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Orders Goal */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📦</span>
                      <span className="text-white font-medium">Orders Goal</span>
                    </div>
                    <div className="text-white/40 text-sm">Target orders per {goalPeriod}</div>
                  </div>
                  <input
                    type="number"
                    value={ordersGoal}
                    onChange={(e) => setOrdersGoal(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="100"
                    className="w-28 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                  />
                </div>
              </div>

              {/* ROAS Goal */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📈</span>
                      <span className="text-white font-medium">ROAS Goal</span>
                    </div>
                    <div className="text-white/40 text-sm">Target return on ad spend</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={roasGoal}
                      onChange={(e) => setRoasGoal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      step="0.1"
                      placeholder="2.5"
                      className="w-20 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                    <span className="text-white/60">x</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveGoals}
                disabled={savingGoals}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {savingGoals ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Goals'
                )}
              </button>
              <p className="text-white/40 text-xs">Goals will appear on your dashboard with progress tracking</p>
            </div>
          </div>

          {/* Slack Integration */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#4A154B]/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Slack Integration</h2>
                <p className="text-white/60 text-sm">Get alerts and summaries in Slack</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Webhook URL Input */}
              <div>
                <label className="text-white/60 text-sm block mb-2">Slack Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-sm"
                  />
                  <button
                    onClick={handleTestSlack}
                    disabled={testingSlack || !slackWebhookUrl}
                    className="px-4 py-2 bg-[#4A154B] hover:bg-[#611f69] disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                  >
                    {testingSlack ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Test & Connect'
                    )}
                  </button>
                </div>
                <p className="text-white/40 text-xs mt-2">
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:underline"
                  >
                    Create a Slack webhook
                  </a>
                  {' '}in your workspace to receive alerts
                </p>
              </div>

              {/* Options */}
              {slackEnabled && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Slack Connected</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Daily Summary</div>
                      <div className="text-white/40 text-sm">Receive a daily performance summary in Slack</div>
                    </div>
                    <button
                      onClick={() => setSlackDailySummary(!slackDailySummary)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        slackDailySummary ? 'bg-green-600' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        slackDailySummary ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveSlackSettings}
                disabled={savingSlackSettings}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                {savingSlackSettings ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Slack Settings'
                )}
              </button>
            </div>
          </div>

          {/* Meta Conversions API */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Meta Conversions API
              </h2>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full font-medium">
                Pro
              </span>
            </div>
            <p className="text-white/60 mb-6 text-sm">
              Send purchase events server-side to Meta to recover ~30% of attribution lost to iOS14 tracking restrictions.
              Works alongside the browser pixel — Meta automatically dedupes by order ID.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Meta Pixel ID
                </label>
                <input
                  type="text"
                  value={capiPixelId}
                  onChange={(e) => setCapiPixelId(e.target.value)}
                  placeholder="e.g. 1234567890123456"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
                <p className="text-white/40 text-xs mt-1">
                  Find in Meta Events Manager → Your pixel → Settings
                </p>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Conversions API Access Token
                </label>
                <input
                  type="password"
                  value={capiToken}
                  onChange={(e) => setCapiToken(e.target.value)}
                  placeholder={capiToken && capiToken.includes('•') ? capiToken : 'Paste your CAPI token'}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                />
                <p className="text-white/40 text-xs mt-1">
                  Generate at Events Manager → Your pixel → Settings → Conversions API → Generate Access Token
                </p>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Test Event Code{' '}
                  <span className="text-white/40 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={capiTestCode}
                  onChange={(e) => setCapiTestCode(e.target.value)}
                  placeholder="e.g. TEST12345"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                />
                <p className="text-white/40 text-xs mt-1">
                  When set, events appear in Events Manager → Test Events for verification. Remove for production.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white font-medium text-sm">Enable Conversions API</div>
                  <div className="text-white/40 text-xs">
                    Forward purchase events server-side to Meta
                  </div>
                </div>
                <button
                  onClick={() => setCapiEnabled(!capiEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    capiEnabled ? 'bg-green-600' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      capiEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {capiTestResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    capiTestResult.ok
                      ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  {capiTestResult.ok ? '✅ ' : '❌ '}
                  {capiTestResult.msg}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCapi}
                  disabled={savingCapi}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  {savingCapi ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save CAPI Settings'
                  )}
                </button>
                <button
                  onClick={handleTestCapi}
                  disabled={testingCapi || !capiPixelId}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  {testingCapi ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </button>
              </div>

              <div className="text-white/40 text-xs">
                <a
                  href="https://developers.facebook.com/docs/marketing-api/conversions-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Meta Conversions API setup guide →
                </a>
              </div>
            </div>
          </div>

          {/* Developer Tools */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-purple-400 mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Developer Tools
            </h2>
            <p className="text-white/60 mb-6 text-sm">
              Testing and development utilities
            </p>

            <div className="space-y-4">
              {/* Demo Data Section */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium">Demo Data</div>
                    <div className="text-white/40 text-sm">
                      Populate dashboard with realistic sample data
                    </div>
                  </div>
                </div>

                {demoDataCounts && (demoDataCounts.orders > 0 || demoDataCounts.campaigns > 0) && (
                  <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="text-sm text-purple-300 mb-2">Current Demo Data:</div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{demoDataCounts.orders}</div>
                        <div className="text-xs text-white/50">Orders</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{demoDataCounts.campaigns}</div>
                        <div className="text-xs text-white/50">Campaign Days</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{demoDataCounts.pixelEvents}</div>
                        <div className="text-xs text-white/50">Pixel Events</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSeedDemoData}
                    disabled={seedingDemo}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    {seedingDemo ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Seeding Data...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Seed Demo Data
                      </>
                    )}
                  </button>
                  {demoDataCounts && (demoDataCounts.orders > 0 || demoDataCounts.campaigns > 0) && (
                    <button
                      onClick={handleClearDemoData}
                      disabled={clearingDemo}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                      {clearingDemo ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-white/40 text-xs mt-3">
                  Seeds 60 days of data: ~150 orders, 7 campaigns with daily metrics, funnel events (page views, add to cart, checkout, purchase), and product costs.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
            <p className="text-white/60 mb-4">
              Uninstalling will remove all data and disconnect your store.
            </p>
            <button
              onClick={() => {
                const shop = store?.shop_domain;
                if (shop) {
                  const storeName = shop.replace('.myshopify.com', '');
                  window.top?.location.assign(`https://admin.shopify.com/store/${storeName}/settings/apps?tab=installed`);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
            >
              Uninstall App
            </button>
          </div>
        </div>
      </main>
      <MobileNav activePage="settings" />
    </div>
  );
}

export default function SettingsPage() {
  console.log('🔧 SettingsPage rendering...');
  return <SettingsContent />;
}
