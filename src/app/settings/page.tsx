'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database,
  Mail,
  Smartphone,
  Save,
  RefreshCw
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SystemSettings {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  currency: string;
  timeZone: string;
  language: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  sessionTimeout: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    schoolName: 'Futbol Okulu',
    schoolAddress: 'İstanbul, Türkiye',
    schoolPhone: '+90 212 555 0000',
    schoolEmail: 'info@futbolokulu.com',
    currency: 'TRY',
    timeZone: 'Europe/Istanbul',
    language: 'tr',
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    backupFrequency: 'daily',
    sessionTimeout: 24
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) {
      // Redirect non-admin users
      window.location.href = '/dashboard';
      return;
    }
    loadSettings();
  }, [isAdmin]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Ayarlar kaydedildi",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Test E-postası Gönderildi",
          description: "E-posta ayarlarınızı kontrol edin",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Test e-postası gönderilemedi",
        variant: "destructive",
      });
    }
  };

  const handleTestSMS = async () => {
    try {
      const response = await fetch('/api/settings/test-sms', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Test SMS Gönderildi",
          description: "SMS ayarlarınızı kontrol edin",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Test SMS gönderilemedi",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
              <p className="text-muted-foreground">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-6 space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistem Ayarları</h1>
          <p className="text-muted-foreground">
            Okul bilgileri ve sistem konfigürasyonu
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadSettings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Okul Bilgileri
            </CardTitle>
            <CardDescription>
              Temel okul bilgileri ve iletişim detayları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="schoolName">Okul Adı</Label>
              <Input
                id="schoolName"
                value={settings.schoolName}
                onChange={(e) => setSettings(prev => ({ ...prev, schoolName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="schoolAddress">Adres</Label>
              <Input
                id="schoolAddress"
                value={settings.schoolAddress}
                onChange={(e) => setSettings(prev => ({ ...prev, schoolAddress: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="schoolPhone">Telefon</Label>
              <Input
                id="schoolPhone"
                value={settings.schoolPhone}
                onChange={(e) => setSettings(prev => ({ ...prev, schoolPhone: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="schoolEmail">E-posta</Label>
              <Input
                id="schoolEmail"
                type="email"
                value={settings.schoolEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, schoolEmail: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sistem Konfigürasyonu
            </CardTitle>
            <CardDescription>
              Dil, para birimi ve zaman dilimi ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency">Para Birimi</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">Türk Lirası (TRY)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="language">Dil</Label>
              <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timeZone">Zaman Dilimi</Label>
              <Select value={settings.timeZone} onValueChange={(value) => setSettings(prev => ({ ...prev, timeZone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Istanbul">İstanbul (GMT+3)</SelectItem>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sessionTimeout">Oturum Zaman Aşımı (Saat)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="1"
                max="72"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Bildirim Ayarları
            </CardTitle>
            <CardDescription>
              E-posta ve SMS bildirim konfigürasyonu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <Label htmlFor="emailNotifications">E-posta Bildirimleri</Label>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4" />
                <Label htmlFor="smsNotifications">SMS Bildirimleri</Label>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={handleTestEmail} className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Test E-posta
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestSMS} className="flex-1">
                <Smartphone className="h-4 w-4 mr-2" />
                Test SMS
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Yedekleme Ayarları
            </CardTitle>
            <CardDescription>
              Otomatik yedekleme ve veri güvenliği
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoBackup">Otomatik Yedekleme</Label>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
              />
            </div>
            
            {settings.autoBackup && (
              <div>
                <Label htmlFor="backupFrequency">Yedekleme Sıklığı</Label>
                <Select value={settings.backupFrequency} onValueChange={(value) => setSettings(prev => ({ ...prev, backupFrequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Günlük</SelectItem>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                    <SelectItem value="monthly">Aylık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="pt-4">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Manuel Yedekleme Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Bilgileri</CardTitle>
          <CardDescription>
            Sistem durumu ve sürüm bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="font-medium">Sistem Sürümü</h4>
              <p className="text-2xl font-bold text-primary">v1.0.0</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="font-medium">Veritabanı</h4>
              <p className="text-2xl font-bold text-green-600">Bağlı</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="font-medium">Son Güncelleme</h4>
              <p className="text-sm text-muted-foreground">25.09.2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}