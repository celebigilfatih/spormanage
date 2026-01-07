'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
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
  RefreshCw,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Upload,
  X,
  MapPin,
  Square
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

interface SystemSettings {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo?: string | null;
  currency: string;
  timeZone: string;
  language: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  sessionTimeout: number;
}

interface FeeType {
  id: string;
  name: string;
  amount: number;
  period: string;
  groupId?: string | null;
  isActive: boolean;
  group?: {
    id: string;
    name: string;
  } | null;
}

interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  managerName?: string | null;
  isActive: boolean;
  _count?: {
    students: number;
  };
}

interface Field {
  id: string;
  name: string;
  branchId?: string | null;
  capacity?: number | null;
  location?: string | null;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
  } | null;
}

interface Location {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  isActive: boolean;
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [editingFeeType, setEditingFeeType] = useState<FeeType | null>(null);
  const [newFeeType, setNewFeeType] = useState({ name: '', period: 'MONTHLY' });
  const [showFeeTypeForm, setShowFeeTypeForm] = useState(false);
  
  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', phone: '', email: '', managerName: '' });
  const [showBranchForm, setShowBranchForm] = useState(false);
  
  // Field state
  const [fields, setFields] = useState<Field[]>([]);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [newField, setNewField] = useState({ name: '', branchId: '', capacity: '', location: '' });
  const [showFieldForm, setShowFieldForm] = useState(false);
  
  // Location state
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', city: '', district: '' });
  const [showLocationForm, setShowLocationForm] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings: contextSettings, updateSettings: updateContextSettings } = useSettings();

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) {
      // Redirect non-admin users
      window.location.href = '/dashboard';
      return;
    }
    loadSettings();
    loadFeeTypes();
    loadBranches();
    loadFields();
    loadLocations();
  }, [isAdmin]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
        if (data.schoolLogo) {
          setLogoPreview(data.schoolLogo);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeeTypes = async () => {
    try {
      const response = await fetch('/api/fee-types');
      if (response.ok) {
        const data = await response.json();
        setFeeTypes(data);
      }
    } catch (error) {
      console.error('Failed to load fee types:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const loadFields = async () => {
    try {
      const response = await fetch('/api/fields');
      if (response.ok) {
        const data = await response.json();
        setFields(data);
      }
    } catch (error) {
      console.error('Failed to load fields:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Hata",
        description: "Lütfen bir resim dosyası seçiniz",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 2MB'dan küçük olmalıdır",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      setSettings(prev => ({ ...prev, schoolLogo: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setSettings(prev => ({ ...prev, schoolLogo: null }));
  };

  const handleSaveFeeType = async () => {
    try {
      const feeTypeData = {
        name: newFeeType.name,
        period: newFeeType.period,
        amount: 0 // Default amount, will be set when creating payment
      };

      const url = editingFeeType ? `/api/fee-types/${editingFeeType.id}` : '/api/fee-types';
      const method = editingFeeType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeTypeData),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: editingFeeType ? "Ücret tipi güncellendi" : "Ücret tipi oluşturuldu",
        });
        setNewFeeType({ name: '', period: 'MONTHLY' });
        setEditingFeeType(null);
        setShowFeeTypeForm(false);
        loadFeeTypes();
      } else {
        throw new Error('Failed to save fee type');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ücret tipi kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const handleEditFeeType = (feeType: FeeType) => {
    setEditingFeeType(feeType);
    setNewFeeType({
      name: feeType.name,
      period: feeType.period
    });
    setShowFeeTypeForm(true);
  };

  const handleDeleteFeeType = async (id: string) => {
    if (!confirm('Bu ücret tipini silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/fee-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Ücret tipi silindi",
        });
        loadFeeTypes();
      } else {
        throw new Error('Failed to delete fee type');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ücret tipi silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleCancelFeeType = () => {
    setShowFeeTypeForm(false);
    setEditingFeeType(null);
    setNewFeeType({ name: '', period: 'MONTHLY' });
  };

  // Branch handlers
  const handleSaveBranch = async () => {
    try {
      const branchData = {
        name: newBranch.name,
        address: newBranch.address || null,
        phone: newBranch.phone || null,
        email: newBranch.email || null,
        managerName: newBranch.managerName || null
      };

      const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
      const method = editingBranch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchData),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: editingBranch ? "Şube güncellendi" : "Şube oluşturuldu",
        });
        setNewBranch({ name: '', address: '', phone: '', email: '', managerName: '' });
        setEditingBranch(null);
        setShowBranchForm(false);
        loadBranches();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save branch');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Şube kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setNewBranch({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      managerName: branch.managerName || ''
    });
    setShowBranchForm(true);
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Bu şubeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/branches/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Şube silindi",
        });
        loadBranches();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete branch');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Şube silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleCancelBranch = () => {
    setShowBranchForm(false);
    setEditingBranch(null);
    setNewBranch({ name: '', address: '', phone: '', email: '', managerName: '' });
  };

  // Field handlers
  const handleSaveField = async () => {
    try {
      const fieldData = {
        name: newField.name,
        branchId: newField.branchId || null,
        capacity: newField.capacity ? parseInt(newField.capacity) : null,
        location: newField.location || null
      };

      const url = editingField ? `/api/fields/${editingField.id}` : '/api/fields';
      const method = editingField ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: editingField ? "Saha güncellendi" : "Saha oluşturuldu",
        });
        setNewField({ name: '', branchId: '', capacity: '', location: '' });
        setEditingField(null);
        setShowFieldForm(false);
        loadFields();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save field');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Saha kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
    setNewField({
      name: field.name,
      branchId: field.branchId || '',
      capacity: field.capacity?.toString() || '',
      location: field.location || ''
    });
    setShowFieldForm(true);
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('Bu sahayı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/fields/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Saha silindi",
        });
        loadFields();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete field');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Saha silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleCancelField = () => {
    setShowFieldForm(false);
    setEditingField(null);
    setNewField({ name: '', branchId: '', capacity: '', location: '' });
  };

  // Location handlers
  const handleSaveLocation = async () => {
    try {
      const locationData = {
        name: newLocation.name,
        address: newLocation.address || null,
        city: newLocation.city || null,
        district: newLocation.district || null
      };

      const url = editingLocation ? `/api/locations/${editingLocation.id}` : '/api/locations';
      const method = editingLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: editingLocation ? "Lokasyon güncellendi" : "Lokasyon oluşturuldu",
        });
        setNewLocation({ name: '', address: '', city: '', district: '' });
        setEditingLocation(null);
        setShowLocationForm(false);
        loadLocations();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save location');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Lokasyon kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      district: location.district || ''
    });
    setShowLocationForm(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Bu lokasyonu silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Lokasyon silindi",
        });
        loadLocations();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete location');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Lokasyon silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleCancelLocation = () => {
    setShowLocationForm(false);
    setEditingLocation(null);
    setNewLocation({ name: '', address: '', city: '', district: '' });
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
        // Update the context with new settings
        updateContextSettings(settings);
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

  const handleManualBackup = async (format: 'auto' | 'sql' | 'json' = 'auto') => {
    try {
      console.log('[Settings] Starting manual backup, format:', format);
      const url = format === 'auto' ? '/api/settings/backup' : `/api/settings/backup?format=${format}`;
      const res = await fetch(url);
      console.log('[Settings] Backup response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Settings] Backup failed:', errorData);
        throw new Error(errorData.error || 'Backup failed');
      }
      
      const blob = await res.blob();
      console.log('[Settings] Blob received, type:', blob.type, 'size:', blob.size);
      
      const url2 = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Determine file extension based on content type
      let ext = '.json';
      if (blob.type === 'application/sql' || blob.type === 'text/plain') {
        ext = '.sql';
      } else if (blob.type === 'application/octet-stream') {
        ext = '.db';
      }
      
      const filename = `aidat_takip_backup_${new Date().toISOString().replace(/[:.]/g, '-')}${ext}`;
      console.log('[Settings] Downloading as:', filename);
      
      a.href = url2;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url2);
      
      toast({
        title: "Yedek oluşturuldu",
        description: `Yedek dosyası indirildi (${ext})`,
      });
    } catch (error) {
      console.error('[Settings] Backup error:', error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Yedek oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Yetkisiz Erişim</h2>
              <p className="text-muted-foreground">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            {/* Logo Upload */}
            <div>
              <Label htmlFor="schoolLogo">Okul Logosu</Label>
              <div className="mt-2">
                {(settings.schoolLogo || logoPreview) ? (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview || settings.schoolLogo || ''}
                      alt="Okul Logosu"
                      className="h-24 w-24 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Logoyu Kaldır"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="schoolLogo"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer block"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Logo yüklemek için tıklayın</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF (Maks 2MB)</p>
                    <input
                      id="schoolLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={saving}
                    />
                  </label>
                )}
                {(settings.schoolLogo || logoPreview) && (
                  <div className="mt-3 flex items-center gap-2">
                    <label htmlFor="schoolLogoReplace" className="text-sm font-medium cursor-pointer text-blue-600 hover:text-blue-700">
                      Değiştir
                    </label>
                    <input
                      id="schoolLogoReplace"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={saving}
                    />
                  </div>
                )}
              </div>
            </div>
            
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

        {/* Fee Types Management - Single Row */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Ücret Tipleri
                </CardTitle>
                <CardDescription>
                  Ücret tiplerinizi tanımlayın (Fiyatlar ödeme eklerken belirlenir)
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowFeeTypeForm(!showFeeTypeForm)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ücret Tipi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showFeeTypeForm && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h4 className="font-medium">
                  {editingFeeType ? 'Ücret Tipini Düzenle' : 'Yeni Ücret Tipi Ekle'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="feeTypeName">Ücret Adı</Label>
                    <Input
                      id="feeTypeName"
                      placeholder="Örn: Aylık Aidat"
                      value={newFeeType.name}
                      onChange={(e) => setNewFeeType(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feeTypePeriod">Periyot</Label>
                    <Select
                      value={newFeeType.period}
                      onValueChange={(value) => setNewFeeType(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Aylık</SelectItem>
                        <SelectItem value="QUARTERLY">3 Aylık</SelectItem>
                        <SelectItem value="SEMI_ANNUAL">6 Aylık</SelectItem>
                        <SelectItem value="YEARLY">Yıllık</SelectItem>
                        <SelectItem value="ONE_TIME">Tek Seferlik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelFeeType}>
                    İptal
                  </Button>
                  <Button
                    onClick={handleSaveFeeType}
                    disabled={!newFeeType.name}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingFeeType ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </div>
            )}

            {feeTypes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz ücret tipi tanımlanmamış</p>
                <p className="text-sm">Yeni ücret tipi eklemek için yukarıdaki butonu kullanın</p>
              </div>
            ) : (
              <div className="space-y-2">
                {feeTypes.map((feeType) => (
                  <div
                    key={feeType.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{feeType.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                          {feeType.period === 'MONTHLY' && 'Aylık'}
                          {feeType.period === 'QUARTERLY' && '3 Aylık'}
                          {feeType.period === 'SEMI_ANNUAL' && '6 Aylık'}
                          {feeType.period === 'YEARLY' && 'Yıllık'}
                          {feeType.period === 'ONE_TIME' && 'Tek Seferlik'}
                        </span>
                        {feeType.group && (
                          <span className="text-xs">Grup: {feeType.group.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFeeType(feeType)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFeeType(feeType.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Şube Yönetimi
                </CardTitle>
                <CardDescription>
                  Okul şubelerinizi tanımlayın ve yönetin
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowBranchForm(!showBranchForm)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Şube
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showBranchForm && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h4 className="font-medium">
                  {editingBranch ? 'Şubeyi Düzenle' : 'Yeni Şube Ekle'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="branchName">Şube Adı *</Label>
                    <Input
                      id="branchName"
                      placeholder="Örn: Merkez Şube"
                      value={newBranch.name}
                      onChange={(e) => setNewBranch(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="branchManagerName">Şube Müdürü</Label>
                    <Input
                      id="branchManagerName"
                      placeholder="Müdür adı"
                      value={newBranch.managerName}
                      onChange={(e) => setNewBranch(prev => ({ ...prev, managerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="branchPhone">Telefon</Label>
                    <Input
                      id="branchPhone"
                      placeholder="+90 555 123 4567"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="branchEmail">E-posta</Label>
                    <Input
                      id="branchEmail"
                      type="email"
                      placeholder="sube@futbolokulu.com"
                      value={newBranch.email}
                      onChange={(e) => setNewBranch(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="branchAddress">Adres</Label>
                    <Input
                      id="branchAddress"
                      placeholder="Şube adresi"
                      value={newBranch.address}
                      onChange={(e) => setNewBranch(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelBranch}>
                    İptal
                  </Button>
                  <Button
                    onClick={handleSaveBranch}
                    disabled={!newBranch.name}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingBranch ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </div>
            )}

            {branches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz şube tanımlanmamış</p>
                <p className="text-sm">Yeni şube eklemek için yukarıdaki butonu kullanın</p>
              </div>
            ) : (
              <div className="space-y-2">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{branch.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                        {branch.managerName && (
                          <div>Müdür: {branch.managerName}</div>
                        )}
                        {branch.phone && (
                          <div>Tel: {branch.phone}</div>
                        )}
                        {branch.email && (
                          <div>E-posta: {branch.email}</div>
                        )}
                        {branch.address && (
                          <div className="md:col-span-2">Adres: {branch.address}</div>
                        )}
                        {branch._count && (
                          <div className="md:col-span-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                              {branch._count.students} Öğrenci
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBranch(branch)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBranch(branch.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Field Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Square className="h-5 w-5" />
                  Saha Yönetimi
                </CardTitle>
                <CardDescription>
                  Antrenman sahalarınızı tanımlayın ve yönetin
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowFieldForm(!showFieldForm)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Saha
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showFieldForm && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h4 className="font-medium">
                  {editingField ? 'Sahayı Düzenle' : 'Yeni Saha Ekle'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fieldName">Saha Adı *</Label>
                    <Input
                      id="fieldName"
                      placeholder="Örn: Saha 1"
                      value={newField.name}
                      onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fieldBranch">Şube</Label>
                    <Select
                      value={newField.branchId}
                      onValueChange={(value) => setNewField(prev => ({ ...prev, branchId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Şube seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.filter(b => b.isActive).map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fieldCapacity">Kapasite</Label>
                    <Input
                      id="fieldCapacity"
                      type="number"
                      placeholder="Kişi sayısı"
                      value={newField.capacity}
                      onChange={(e) => setNewField(prev => ({ ...prev, capacity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fieldLocation">Konum Bilgisi</Label>
                    <Input
                      id="fieldLocation"
                      placeholder="Örn: Batı Kapısı yanı"
                      value={newField.location}
                      onChange={(e) => setNewField(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelField}>
                    İptal
                  </Button>
                  <Button
                    onClick={handleSaveField}
                    disabled={!newField.name}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingField ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </div>
            )}

            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Square className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz saha tanımlanmamış</p>
                <p className="text-sm">Yeni saha eklemek için yukarıdaki butonu kullanın</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{field.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {field.branch && (
                          <span>Şube: {field.branch.name}</span>
                        )}
                        {field.capacity && (
                          <span>Kapasite: {field.capacity}</span>
                        )}
                        {field.location && (
                          <span>Konum: {field.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditField(field)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Lokasyon Yönetimi
                </CardTitle>
                <CardDescription>
                  Antrenman lokasyonlarınızı tanımlayın ve yönetin
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowLocationForm(!showLocationForm)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Lokasyon
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showLocationForm && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h4 className="font-medium">
                  {editingLocation ? 'Lokasyonu Düzenle' : 'Yeni Lokasyon Ekle'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="locationName">Lokasyon Adı *</Label>
                    <Input
                      id="locationName"
                      placeholder="Örn: Merkez Tesis"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationCity">Şehir</Label>
                    <Input
                      id="locationCity"
                      placeholder="Örn: İstanbul"
                      value={newLocation.city}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationDistrict">İlçe</Label>
                    <Input
                      id="locationDistrict"
                      placeholder="Örn: Kadıköy"
                      value={newLocation.district}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, district: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationAddress">Adres</Label>
                    <Input
                      id="locationAddress"
                      placeholder="Detaylı adres"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelLocation}>
                    İptal
                  </Button>
                  <Button
                    onClick={handleSaveLocation}
                    disabled={!newLocation.name}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingLocation ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </div>
            )}

            {locations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz lokasyon tanımlanmamış</p>
                <p className="text-sm">Yeni lokasyon eklemek için yukarıdaki butonu kullanın</p>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{location.name}</h4>
                      <div className="text-sm text-muted-foreground mt-1">
                        {location.district && location.city && (
                          <span>{location.district}, {location.city}</span>
                        )}
                        {location.address && (
                          <div className="mt-1">{location.address}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLocation(location)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLocation(location.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            
            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full" onClick={() => handleManualBackup('sql')}>
                <Database className="h-4 w-4 mr-2" />
                SQL Dump İndir (.sql)
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleManualBackup('json')}>
                <Database className="h-4 w-4 mr-2" />
                JSON Export İndir (.json)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information - Single Row */}
        <Card className="lg:col-span-3">
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
    </AppLayout>
  );
}