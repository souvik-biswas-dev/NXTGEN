import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
  Dimensions,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageGallery } from '@/components/ImageGallery';
import { BrokerBadge } from '@/components/BrokerBadge';
import { usePropertiesStore } from '@/stores/propertiesStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { useCompareStore, MAX_COMPARE_SIZE } from '@/stores/compareStore';
import { PropertyCard } from '@/components/PropertyCard';
import { Property } from '@/types';
import { api } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

Dimensions.get('window');

type Colors = ReturnType<typeof useTheme>['colors'];

export default function PropertyDetailScreen() {
  const { colors, roundness, dark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPropertyById, getSimilarProperties } = usePropertiesStore();
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { addToRecentlyViewed } = useRecentlyViewedStore();
  const compare = useCompareStore();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'details'>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMsg, setOfferMsg] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      setLoading(true);
      const data = await getPropertyById(id);
      setProperty(data || null);
      setLoading(false);
      if (data) {
        getSimilarProperties(data).then(setSimilar);
      }
    };
    if (id) loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (property?.id) {
      addToRecentlyViewed(property.id);
      api.post(`/properties/${property.id}/view`).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id]);

  if (loading || !property) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isLiked = isFavorite(property.id);
  const contact = property.broker || property.owner;

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const perSqft =
    property.area_sqft && property.area_sqft > 0
      ? `₹${Math.round(property.price / property.area_sqft).toLocaleString('en-IN')}/sqft`
      : null;

  const contactUserId = contact?.user_id;
  const phoneToUse = revealedPhone ?? contact?.phone ?? null;

  const viewNumber = async () => {
    if (!contactUserId) return;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to view contact details.');
      return;
    }
    setRevealing(true);
    try {
      const res = await api.get<{ allowed: boolean; phone: string | null }>(
        `/users/${contactUserId}/contact`
      );
      setRevealedPhone(res.phone);
      if (!res.allowed) {
        Alert.alert(
          'Number hidden',
          'Send an inquiry or start a chat to unlock the full contact number.'
        );
      }
    } catch {
      Alert.alert('Error', 'Could not fetch contact details.');
    } finally {
      setRevealing(false);
    }
  };

  const submitOffer = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to make an offer.');
      return;
    }
    const amount = Number(offerAmount.replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) {
      Alert.alert('Enter an amount', 'Please enter a valid offer amount.');
      return;
    }
    setSendingOffer(true);
    try {
      await api.post('/offers', {
        propertyId: property.id,
        amount,
        message: offerMsg.trim() || undefined,
      });
      Alert.alert('Offer sent!', 'The owner/broker will review your offer and respond.');
      setShowOffer(false);
      setOfferAmount('');
      setOfferMsg('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not send offer');
    } finally {
      setSendingOffer(false);
    }
  };

  const handleCall = async () => {
    if (!phoneToUse) {
      await viewNumber();
      return;
    }
    const url = `tel:${phoneToUse}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  const handleWhatsApp = async () => {
    if (!phoneToUse) {
      await viewNumber();
      return;
    }
    const message = encodeURIComponent(`Hi, I'm interested in ${property.title}`);
    const url = `https://wa.me/${phoneToUse.replace(/[^0-9]/g, '')}?text=${message}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this property on NxtGen Properties!\n\n${property.title}\n${formatPrice(property.price)}\n${property.locality}, ${property.city}\n\nhttps://nxtgenproperties.app/property/${property.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFavorite = async () => {
    if (user) {
      try {
        await toggleFavorite(property.id);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };

  const handleSendInquiry = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to send an inquiry.');
      return;
    }
    if (!inquiryMsg.trim()) {
      Alert.alert('Message required', 'Please enter your message before sending.');
      return;
    }
    setSendingInquiry(true);
    try {
      await api.post('/inquiries', { propertyId: property.id, message: inquiryMsg.trim() });
      Alert.alert('Inquiry sent!', 'The owner/broker will get back to you shortly.');
      setShowInquiry(false);
      setInquiryMsg('');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not send inquiry');
    } finally {
      setSendingInquiry(false);
    }
  };

  const highlights: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
    { icon: 'home-outline', label: 'Property Type', value: property.category },
    {
      icon: 'layers-outline',
      label: 'Floor',
      value: `${property.floor || 'G'} of ${property.total_floors || 'N/A'}`,
    },
    { icon: 'compass-outline', label: 'Facing', value: property.facing || 'N/A' },
    { icon: 'construct-outline', label: 'Furnishing', value: property.furnishing },
    { icon: 'calendar-outline', label: 'Possession', value: property.possession.replace('-', ' ') },
    {
      icon: 'time-outline',
      label: 'Property Age',
      value: property.age_years ? `${property.age_years} years` : 'New',
    },
  ];

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View className="relative">
          <ImageGallery images={property.photos} />

          <View className="absolute top-12 left-0 right-0 flex-row items-center justify-between px-5">
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              style={styles.glassBtn}
            >
              <Ionicons name="arrow-back" size={22} color="#1B2838" />
            </TouchableOpacity>
            <View className="flex-row">
              <TouchableOpacity
                onPress={handleFavorite}
                style={[styles.glassBtn, { marginRight: 8 }]}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isLiked ? '#EF4444' : '#1B2838'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.glassBtn}>
                <Ionicons name="share-social-outline" size={22} color="#1B2838" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ position: 'absolute', bottom: 56, left: 16, flexDirection: 'row' }}>
            {property.featured && (
              <View
                style={{
                  backgroundColor: colors.gold,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 999,
                  marginRight: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="star" size={12} color="#1B2838" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#1B2838', marginLeft: 4 }}>
                  FEATURED
                </Text>
              </View>
            )}
            {property.verified && (
              <View
                style={{
                  backgroundColor: colors.success,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginLeft: 4 }}>
                  VERIFIED
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Price rail — premium teal→navy gradient (fixed; white text reads in both themes) */}
        <LinearGradient
          colors={['#0F766E', '#0B1220']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginTop: -24,
            marginHorizontal: 16,
            borderRadius: 20,
            padding: 18,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 0.2 }}>
              {formatPrice(property.price)}
            </Text>
            {property.type === 'rent' && (
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginLeft: 4 }}>
                /mo
              </Text>
            )}
            {perSqft && (
              <View
                style={{
                  marginLeft: 'auto',
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{perSqft}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="location" size={14} color={colors.gold} />
            <Text
              style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginLeft: 4 }}
              numberOfLines={1}
            >
              {property.locality}, {property.city}
            </Text>
          </View>
        </LinearGradient>

        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          <Text style={{ color: colors.onSurface, fontSize: 21, fontWeight: '800' }}>
            {property.title}
          </Text>
        </View>

        {/* Key stat bubbles */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
          {[
            { icon: 'bed-outline' as const, value: property.bedrooms, label: 'Beds' },
            { icon: 'water-outline' as const, value: property.bathrooms, label: 'Baths' },
            { icon: 'resize-outline' as const, value: property.area_sqft, label: 'Sq.ft' },
            { icon: 'car-outline' as const, value: property.parkings, label: 'Parking' },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 12,
                backgroundColor: colors.cardBackground,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 5,
                }}
              >
                <Ionicons name={s.icon} size={16} color={colors.primary} />
              </View>
              <Text style={{ color: colors.onSurface, fontWeight: '800', fontSize: 14 }}>
                {s.value}
              </Text>
              <Text
                style={{ color: colors.outline, fontSize: 10, fontWeight: '600', marginTop: 1 }}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Segmented tabs */}
        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 16,
            backgroundColor: colors.surfaceVariant,
            padding: 4,
            borderRadius: 14,
            marginBottom: 8,
          }}
        >
          {(['overview', 'amenities', 'details'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: active ? colors.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: '700',
                    textTransform: 'capitalize',
                    color: active ? '#fff' : colors.outline,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Overview */}
        {activeTab === 'overview' && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: colors.onSurface,
                  fontSize: 18,
                  fontWeight: '800',
                  marginBottom: 10,
                }}
              >
                Description
              </Text>
              <Text
                style={{ color: colors.outline, lineHeight: 22, fontSize: 14 }}
                numberOfLines={showFullDescription ? undefined : 4}
              >
                {property.description}
              </Text>
              <TouchableOpacity
                onPress={() => setShowFullDescription(!showFullDescription)}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  {showFullDescription ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{ color: colors.onSurface, fontSize: 18, fontWeight: '800', marginBottom: 12 }}
            >
              Property Highlights
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {highlights.map((h, i) => (
                <View
                  key={i}
                  style={{
                    width: '50%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      backgroundColor: colors.primaryContainer,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name={h.icon} size={17} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.outline, fontSize: 12 }}>{h.label}</Text>
                    <Text
                      style={{
                        color: colors.onSurface,
                        fontWeight: '700',
                        fontSize: 14,
                        textTransform: 'capitalize',
                      }}
                      numberOfLines={1}
                    >
                      {h.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Amenities */}
        {activeTab === 'amenities' && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            <Text
              style={{ color: colors.onSurface, fontSize: 18, fontWeight: '800', marginBottom: 16 }}
            >
              Amenities
            </Text>
            {property.amenities.length === 0 ? (
              <Text style={{ color: colors.outline }}>No amenities listed for this property.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {property.amenities.map((amenity, index) => (
                  <View
                    key={index}
                    style={{
                      width: '50%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: colors.success + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="checkmark" size={20} color={colors.success} />
                    </View>
                    <Text style={{ color: colors.onSurface, flex: 1, fontSize: 14 }}>
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Details */}
        {activeTab === 'details' && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            <Text
              style={{ color: colors.onSurface, fontSize: 18, fontWeight: '800', marginBottom: 16 }}
            >
              Property Details
            </Text>

            <DetailCard colors={colors} roundness={roundness} title="Area Details">
              <DetailRow
                colors={colors}
                label="Super Built-up Area"
                value={`${property.area_sqft} sq.ft`}
                border
              />
              {property.carpet_area ? (
                <DetailRow
                  colors={colors}
                  label="Carpet Area"
                  value={`${property.carpet_area} sq.ft`}
                  border={!!property.super_built_up}
                />
              ) : null}
              {property.super_built_up ? (
                <DetailRow
                  colors={colors}
                  label="Super Built-up"
                  value={`${property.super_built_up} sq.ft`}
                />
              ) : null}
            </DetailCard>

            <DetailCard colors={colors} roundness={roundness} title="Price Breakdown">
              <DetailRow
                colors={colors}
                label={property.type === 'buy' ? 'Property Price' : 'Monthly Rent'}
                value={formatPrice(property.price)}
                border={!!property.maintenance || (!!property.deposit && property.type === 'rent')}
              />
              {property.maintenance ? (
                <DetailRow
                  colors={colors}
                  label="Maintenance"
                  value={`₹${property.maintenance.toLocaleString('en-IN')}/month`}
                  border={!!property.deposit && property.type === 'rent'}
                />
              ) : null}
              {property.deposit && property.type === 'rent' ? (
                <DetailRow
                  colors={colors}
                  label="Security Deposit"
                  value={formatPrice(property.deposit)}
                />
              ) : null}
            </DetailCard>

            <DetailCard colors={colors} roundness={roundness} title="Location">
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={{ color: colors.onSurface, marginLeft: 8, flex: 1, fontSize: 14 }}>
                  {property.address || `${property.locality}, ${property.city}`}
                </Text>
              </View>
            </DetailCard>
          </View>
        )}

        {/* Contact Card */}
        {contact && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
            <View
              style={{
                backgroundColor: colors.cardBackground,
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Image
                  source={{
                    uri:
                      contact.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&size=100&background=0F766E&color=fff`,
                  }}
                  style={{ width: 56, height: 56, borderRadius: 28 }}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: '800' }}>
                    {contact.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text
                      style={{ color: colors.outline, fontSize: 13, textTransform: 'capitalize' }}
                    >
                      {contact.role}
                    </Text>
                    {contact.verified_broker && (
                      <View style={{ marginLeft: 8 }}>
                        <BrokerBadge verified size="sm" />
                      </View>
                    )}
                  </View>
                  {contact.rating ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Ionicons name="star" size={14} color={colors.gold} />
                      <Text style={{ color: colors.outline, fontSize: 13, marginLeft: 4 }}>
                        {contact.rating} rating
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                onPress={viewNumber}
                disabled={revealing}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.onSurface, fontWeight: '700', marginLeft: 8 }}>
                    {revealedPhone ?? '+91 •••••• ••••'}
                  </Text>
                </View>
                {revealing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                    {revealedPhone ? 'Shown' : 'View Number'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
                <TouchableOpacity
                  onPress={handleCall}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 14,
                    paddingVertical: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  style={{
                    flex: 1,
                    backgroundColor: '#25D366',
                    borderRadius: 14,
                    paddingVertical: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Action Row */}
        <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ActionBtn
              colors={colors}
              icon="calendar"
              label="Site visit"
              onPress={() => router.push(`/site-visit/${property.id}` as never)}
              variant="primary"
            />
            <ActionBtn
              colors={colors}
              icon="git-compare"
              label={compare.has(property.id) ? 'Added' : 'Compare'}
              onPress={() => {
                const ok = compare.toggle(property.id);
                if (!ok && !compare.has(property.id)) router.push('/compare' as never);
              }}
              variant={compare.has(property.id) ? 'filled' : 'outline'}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <ActionBtn
              colors={colors}
              icon="star-outline"
              label="Locality reviews"
              onPress={() =>
                router.push({
                  pathname: '/reviews/locality',
                  params: { locality: property.locality, city: property.city },
                } as never)
              }
              variant="surface"
            />
            <ActionBtn
              colors={colors}
              icon="flag-outline"
              label="Report"
              onPress={() => router.push(`/report/${property.id}` as never)}
              variant="danger"
            />
          </View>
          {compare.propertyIds.length > 1 && (
            <TouchableOpacity
              onPress={() => router.push('/compare' as never)}
              style={{
                marginTop: 10,
                backgroundColor: colors.secondary,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: dark ? colors.background : '#fff',
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                Compare {compare.propertyIds.length} / {MAX_COMPARE_SIZE}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Similar */}
        {similar.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text
              style={{ color: colors.onSurface, fontSize: 18, fontWeight: '800', marginBottom: 12 }}
            >
              Similar properties
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similar.map((sp) => (
                <View key={sp.id} style={{ width: 240, marginRight: 12 }}>
                  <PropertyCard property={sp} variant="featured" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* EMI Banner */}
        <TouchableOpacity
          onPress={() => router.push('/tools/emi-calculator' as any)}
          style={{ marginHorizontal: 20, marginBottom: 16 }}
        >
          <LinearGradient
            colors={['#0F766E', '#0B1220']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 18,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="calculator" size={20} color="#fff" />
              </View>
              <View>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                  Calculate EMI
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                  Plan your home loan
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Safety Tips */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 28,
            backgroundColor: colors.gold + (dark ? '1F' : '22'),
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.gold + '55',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="shield-checkmark" size={20} color={colors.gold} />
            <Text style={{ color: colors.onSurface, fontWeight: '800', marginLeft: 8 }}>
              Safety Tips
            </Text>
          </View>
          <Text style={{ color: colors.outline, fontSize: 13, lineHeight: 20 }}>
            • Never pay any advance without visiting the property{'\n'}• Verify all documents before
            making payment{'\n'}• Meet the owner/broker in person
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 16,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.outlineVariant,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceVariant,
            borderRadius: 32,
            padding: 6,
            gap: 6,
          }}
        >
          <TouchableOpacity
            onPress={handleFavorite}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.outlineVariant,
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? colors.primary : colors.onSurface}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCall}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, marginLeft: 8 }}>
              Call Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowInquiry(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primaryContainer,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowOffer(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.gold,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="pricetag-outline" size={20} color="#1B2838" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#25D366',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Make-an-Offer Modal */}
      <Modal
        visible={showOffer}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 36,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: colors.onSurface }}>
                Make an Offer
              </Text>
              <TouchableOpacity onPress={() => setShowOffer(false)}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.outline, fontSize: 13, marginBottom: 12 }}>
              Listed at {formatPrice(property.price)}. Propose your price — the{' '}
              {contact?.role ?? 'owner'} can accept, reject, or counter.
            </Text>
            <TextInput
              value={offerAmount}
              onChangeText={(t) => setOfferAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="Your offer (₹)"
              placeholderTextColor={colors.outline}
              style={{
                backgroundColor: colors.surfaceVariant,
                borderRadius: 14,
                padding: 14,
                color: colors.onSurface,
                fontSize: 16,
                fontWeight: '700',
                marginBottom: 12,
              }}
            />
            <TextInput
              value={offerMsg}
              onChangeText={setOfferMsg}
              multiline
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.outline}
              style={{
                backgroundColor: colors.surfaceVariant,
                borderRadius: 14,
                padding: 14,
                minHeight: 80,
                textAlignVertical: 'top',
                color: colors.onSurface,
                fontSize: 14,
                marginBottom: 16,
              }}
            />
            <TouchableOpacity
              onPress={submitOffer}
              disabled={sendingOffer}
              style={{
                backgroundColor: colors.gold,
                borderRadius: 24,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {sendingOffer ? (
                <ActivityIndicator color="#1B2838" />
              ) : (
                <>
                  <Ionicons name="pricetag" size={18} color="#1B2838" />
                  <Text style={{ color: '#1B2838', fontWeight: '800', fontSize: 15 }}>
                    Send Offer
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Inquiry Modal */}
      <Modal
        visible={showInquiry}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 36,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: colors.onSurface }}>
                Send Inquiry
              </Text>
              <TouchableOpacity onPress={() => setShowInquiry(false)}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.outline, fontSize: 13, marginBottom: 12 }}>
              Your message will be sent directly to the {contact?.role ?? 'owner'}.
            </Text>
            <TextInput
              value={inquiryMsg}
              onChangeText={setInquiryMsg}
              multiline
              numberOfLines={4}
              placeholder={`Hi, I'm interested in ${property?.title ?? 'this property'}. Please share more details.`}
              placeholderTextColor={colors.outline}
              style={{
                backgroundColor: colors.surfaceVariant,
                borderRadius: 14,
                padding: 14,
                minHeight: 110,
                textAlignVertical: 'top',
                color: colors.onSurface,
                fontSize: 14,
                marginBottom: 16,
              }}
            />
            <TouchableOpacity
              onPress={handleSendInquiry}
              disabled={sendingInquiry}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 24,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {sendingInquiry ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                    Send Inquiry
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  glassBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  } as const,
};

function DetailCard({
  colors,
  roundness,
  title,
  children,
}: {
  colors: Colors;
  roundness: ReturnType<typeof useTheme>['roundness'];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.cardBackground,
        borderRadius: roundness.lg,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
      }}
    >
      <Text style={{ color: colors.onSurface, fontWeight: '800', marginBottom: 10 }}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({
  colors,
  label,
  value,
  border,
}: {
  colors: Colors;
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 9,
        borderBottomWidth: border ? 1 : 0,
        borderBottomColor: colors.outlineVariant,
      }}
    >
      <Text style={{ color: colors.outline, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}>{value}</Text>
    </View>
  );
}

function ActionBtn({
  colors,
  icon,
  label,
  onPress,
  variant,
}: {
  colors: Colors;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant: 'primary' | 'filled' | 'outline' | 'surface' | 'danger';
}) {
  const map = {
    // Fixed navy reads with white text in both light and dark themes.
    primary: { bg: '#1B2838', fg: '#fff', border: 'transparent' },
    filled: { bg: colors.primary, fg: '#fff', border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
    surface: { bg: colors.surfaceVariant, fg: colors.onSurface, border: colors.outlineVariant },
    danger: { bg: colors.error + '18', fg: colors.error, border: colors.error + '44' },
  }[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flex: 1,
        backgroundColor: map.bg,
        paddingVertical: 13,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: map.border,
      }}
    >
      <Ionicons name={icon} size={16} color={map.fg} />
      <Text style={{ color: map.fg, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}
