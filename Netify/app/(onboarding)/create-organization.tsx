import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Input,
  Button,
  Card,
  Alert,
  KeyboardAwareContainer,
} from '@/design/components';
import { BuildingIcon } from '@/design/icons';
import { organizationsApi } from '@/services/api/organizations';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/design/theme';

const createOrgFormSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters'),
  businessType: z.string().min(2, 'Please select your industry category'),
  country: z.string().length(2, 'Please select a valid country'),
  currency: z.string().length(3, 'Select a currency'),
  timezone: z.string().min(3, 'Select a valid timezone'),
});

type CreateOrgFormValues = z.infer<typeof createOrgFormSchema>;

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', timezone: 'Africa/Lagos', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', timezone: 'Africa/Accra', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', timezone: 'Africa/Nairobi', flag: '🇰🇪' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', timezone: 'Africa/Kigali', flag: '🇷🇼' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', timezone: 'Africa/Johannesburg', flag: '🇿🇦' },
  { code: 'US', name: 'Global (USD)', currency: 'USD', timezone: 'UTC', flag: '🌍' },
];

const BUSINESS_TYPES = [
  { id: 'RETAIL', label: 'Retail & Store', icon: '🛍️' },
  { id: 'WHOLESALE', label: 'Wholesale & Distribution', icon: '📦' },
  { id: 'SERVICES', label: 'Services & Consulting', icon: '💼' },
  { id: 'LOGISTICS', label: 'Logistics & Haulage', icon: '🚚' },
  { id: 'MANUFACTURING', label: 'Manufacturing & Production', icon: '🏭' },
  { id: 'HOSPITALITY', label: 'Food & Hospitality', icon: '🍽️' },
  { id: 'AGRICULTURE', label: 'Agriculture & Agro', icon: '🌾' },
  { id: 'HEALTHCARE', label: 'Healthcare & Pharma', icon: '💊' },
  { id: 'TECH_DIGITAL', label: 'Tech & Digital Agency', icon: '💻' },
  { id: 'OTHER', label: 'General Trade & Other', icon: '🏢' },
];

export default function CreateOrganizationScreen() {
  const router = useRouter();
  const setOrganization = useAuthStore((state) => state.setOrganization);
  const { tokens, isDark } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgFormSchema),
    defaultValues: {
      name: '',
      businessType: 'RETAIL',
      country: 'NG',
      currency: 'NGN',
      timezone: 'Africa/Lagos',
    },
  });

  const selectedCountry = watch('country');
  const selectedBusinessType = watch('businessType');

  const handleSelectCountry = (country: (typeof COUNTRIES)[0]) => {
    setValue('country', country.code);
    setValue('currency', country.currency);
    setValue('timezone', country.timezone);
  };

  const onSubmit = async (values: CreateOrgFormValues) => {
    setErrorMessage(null);
    try {
      const response = await organizationsApi.create({
        name: values.name,
        businessType: values.businessType,
        currency: values.currency,
        country: values.country,
        timezone: values.timezone,
      });

      if (response.success && response.data) {
        setOrganization(
          {
            id: response.data.id,
            name: response.data.name,
            slug: response.data.slug,
            currency: response.data.currency,
          },
          'OWNER'
        );

        router.replace('/(onboarding)');
      } else {
        setErrorMessage(response.message || 'Failed to create organization.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to create organization. Check connection.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
      <KeyboardAwareContainer
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 28,
        }}
      >
        {/* Header */}
        <View className="items-center mb-6">
          <View
            style={{
              backgroundColor: tokens.accentSoft,
              borderColor: tokens.accent,
              borderWidth: 1,
            }}
            className="h-14 w-14 items-center justify-center rounded-2xl mb-3.5"
          >
            <BuildingIcon size={26} color={tokens.accent} />
          </View>
          <Text
            style={{ color: tokens.textPrimary }}
            className="text-2xl font-extrabold tracking-tight text-center"
          >
            Setup Your Business Workspace
          </Text>
          <Text
            style={{ color: tokens.textSecondary }}
            className="text-xs mt-1 text-center px-4"
          >
            Establish your primary multi-tenant organization boundary.
          </Text>
        </View>

        {/* Form Card */}
        <Card className="p-6">
          <View className="gap-5">
            {errorMessage ? (
              <Alert variant="danger" message={errorMessage} />
            ) : null}

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Registered Business / Organization Name"
                  placeholder="e.g. Apex Haulage & Logistics Ltd"
                  leftIcon={<BuildingIcon size={18} color={tokens.textMuted} />}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />

            {/* Industry / Business Type */}
            <View>
              <Text
                style={{ color: tokens.textSecondary }}
                className="text-xs font-semibold uppercase tracking-wider mb-2.5"
              >
                Business Category / Industry
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {BUSINESS_TYPES.map((item) => {
                  const isSelected = selectedBusinessType === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setValue('businessType', item.id)}
                      style={{
                        backgroundColor: isSelected
                          ? tokens.accentSoft
                          : isDark
                          ? tokens.surfaceRaised
                          : tokens.surfaceMuted,
                        borderColor: isSelected ? tokens.accent : tokens.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      }}
                      className="flex-row items-center px-3 py-2 rounded-xl"
                    >
                      <Text className="text-sm mr-1.5">{item.icon}</Text>
                      <Text
                        style={{
                          color: isSelected ? tokens.accent : tokens.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        }}
                        className="text-xs"
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.businessType?.message && (
                <Text className="text-xs text-red-500 mt-1">{errors.businessType.message}</Text>
              )}
            </View>

            {/* Country, Currency & Timezone Selector */}
            <View>
              <Text
                style={{ color: tokens.textSecondary }}
                className="text-xs font-semibold uppercase tracking-wider mb-2.5"
              >
                Primary Market & Operational Currency
              </Text>
              <View className="flex-row flex-wrap gap-2.5">
                {COUNTRIES.map((item) => {
                  const isSelected = selectedCountry === item.code;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      onPress={() => handleSelectCountry(item)}
                      style={{
                        backgroundColor: isSelected
                          ? tokens.accentSoft
                          : isDark
                          ? tokens.surfaceRaised
                          : tokens.surfaceMuted,
                        borderColor: isSelected ? tokens.accent : tokens.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      }}
                      className="flex-row items-center px-3.5 py-2.5 rounded-xl"
                    >
                      <Text className="text-base mr-1.5">{item.flag}</Text>
                      <View>
                        <Text
                          style={{
                            color: isSelected ? tokens.accent : tokens.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          }}
                          className="text-xs"
                        >
                          {item.name} ({item.currency})
                        </Text>
                        <Text
                          style={{ color: tokens.textMuted }}
                          className="text-[10px]"
                        >
                          {item.timezone}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Button
              label="Create Organization & Continue"
              loadingLabel="Setting up business workspace..."
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              className="mt-2"
            />
          </View>
        </Card>
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
}
