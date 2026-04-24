import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';

export default function BudgetCalculatorScreen() {
  const router = useRouter();

  // State for budget details
  const [monthlyIncome, setMonthlyIncome] = useState(150000);
  const [existingEMIs, setExistingEMIs] = useState(0);
  const [downPayment, setDownPayment] = useState(2000000); // 20 Lakh
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);

  // Calculate affordability
  const affordability = useMemo(() => {
    // Assume 40% of income can go towards EMI (after existing EMIs)
    const availableForEMI = monthlyIncome * 0.4 - existingEMIs;

    if (availableForEMI <= 0) {
      return {
        maxEMI: 0,
        maxLoanAmount: 0,
        totalBudget: downPayment,
        recommendedBudget: downPayment,
      };
    }

    // Calculate max loan amount based on EMI capacity
    const monthlyRate = interestRate / 12 / 100;
    const numberOfPayments = loanTenure * 12;

    // Reverse EMI formula to get Principal
    // P = EMI * ((1 + r)^n - 1) / (r * (1 + r)^n)
    const maxLoanAmount =
      (availableForEMI * (Math.pow(1 + monthlyRate, numberOfPayments) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments));

    const totalBudget = maxLoanAmount + downPayment;
    const recommendedBudget = totalBudget * 0.85; // 15% buffer

    return {
      maxEMI: Math.round(availableForEMI),
      maxLoanAmount: Math.round(maxLoanAmount),
      totalBudget: Math.round(totalBudget),
      recommendedBudget: Math.round(recommendedBudget),
    };
  }, [monthlyIncome, existingEMIs, downPayment, interestRate, loanTenure]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatCurrencyFull = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          className="mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-xl font-bold">Budget Calculator</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Budget Display Card */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-5 mt-5 rounded-2xl p-6"
        >
          <Text className="text-white/80 text-sm mb-2">Your Affordable Property Budget</Text>
          <Text className="text-white text-4xl font-bold">
            {formatCurrency(affordability.recommendedBudget)}
          </Text>
          <Text className="text-white/70 text-xs mt-1">
            Maximum: {formatCurrency(affordability.totalBudget)}
          </Text>

          <View className="flex-row mt-4 pt-4 border-t border-white/20">
            <View className="flex-1">
              <Text className="text-white/70 text-xs">Max EMI</Text>
              <Text className="text-white text-lg font-semibold">
                {formatCurrencyFull(affordability.maxEMI)}/mo
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/70 text-xs">Max Loan</Text>
              <Text className="text-white text-lg font-semibold">
                {formatCurrency(affordability.maxLoanAmount)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Affordability Breakdown */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5">
          <Text className="text-gray-900 text-lg font-bold mb-4">Budget Breakdown</Text>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-teal-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="wallet" size={16} color="#0F766E" />
                </View>
                <Text className="text-gray-600">Down Payment</Text>
              </View>
              <Text className="text-gray-900 font-semibold">{formatCurrency(downPayment)}</Text>
            </View>

            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                </View>
                <Text className="text-gray-600">Max Loan Amount</Text>
              </View>
              <Text className="text-gray-900 font-semibold">
                {formatCurrency(affordability.maxLoanAmount)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-teal-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="home" size={16} color="#F97316" />
                </View>
                <Text className="text-gray-700 font-semibold">Total Budget</Text>
              </View>
              <Text className="text-gray-900 font-bold text-lg">
                {formatCurrency(affordability.totalBudget)}
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Income Slider */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-base font-semibold">Monthly Income</Text>
            <View className="bg-green-50 px-3 py-1 rounded-lg">
              <Text className="text-green-600 font-bold">{formatCurrencyFull(monthlyIncome)}</Text>
            </View>
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={25000}
            maximumValue={1000000}
            step={5000}
            value={monthlyIncome}
            onValueChange={setMonthlyIncome}
            minimumTrackTintColor="#10B981"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#10B981"
          />

          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-xs">₹25K</Text>
            <Text className="text-gray-400 text-xs">₹10 L</Text>
          </View>
        </View>

        {/* Existing EMIs */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-base font-semibold">Existing EMIs</Text>
            <View className="bg-red-50 px-3 py-1 rounded-lg">
              <Text className="text-red-600 font-bold">{formatCurrencyFull(existingEMIs)}</Text>
            </View>
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={monthlyIncome * 0.5}
            step={1000}
            value={existingEMIs}
            onValueChange={setExistingEMIs}
            minimumTrackTintColor="#EF4444"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#EF4444"
          />

          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-xs">₹0</Text>
            <Text className="text-gray-400 text-xs">{formatCurrency(monthlyIncome * 0.5)}</Text>
          </View>
        </View>

        {/* Down Payment Slider */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-base font-semibold">Down Payment</Text>
            <View className="bg-teal-50 px-3 py-1 rounded-lg">
              <Text className="text-primary font-bold">{formatCurrency(downPayment)}</Text>
            </View>
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={100000}
            maximumValue={50000000}
            step={100000}
            value={downPayment}
            onValueChange={setDownPayment}
            minimumTrackTintColor="#0F766E"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#0F766E"
          />

          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-xs">₹1 L</Text>
            <Text className="text-gray-400 text-xs">₹5 Cr</Text>
          </View>
        </View>

        {/* Interest Rate & Tenure */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-base font-semibold">Interest Rate</Text>
            <View className="bg-gray-100 px-3 py-1 rounded-lg">
              <Text className="text-gray-700 font-bold">{interestRate.toFixed(1)}%</Text>
            </View>
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={6}
            maximumValue={15}
            step={0.1}
            value={interestRate}
            onValueChange={setInterestRate}
            minimumTrackTintColor="#6B7280"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#6B7280"
          />
        </View>

        <View className="bg-white mx-5 mt-4 rounded-2xl p-5 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-base font-semibold">Loan Tenure</Text>
            <View className="bg-gray-100 px-3 py-1 rounded-lg">
              <Text className="text-gray-700 font-bold">{loanTenure} Years</Text>
            </View>
          </View>

          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={5}
            maximumValue={30}
            step={1}
            value={loanTenure}
            onValueChange={setLoanTenure}
            minimumTrackTintColor="#6B7280"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#6B7280"
          />
        </View>

        {/* Browse Properties Button */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/search')}
          className="bg-green-600 mx-5 rounded-xl py-4 mb-6"
        >
          <Text className="text-white text-center font-semibold text-lg">
            Browse Properties in Budget
          </Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View className="bg-teal-50 mx-5 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="information-circle" size={20} color="#0F766E" />
            <Text className="text-gray-900 font-semibold ml-2">How we calculate</Text>
          </View>
          <Text className="text-gray-600 text-sm leading-5">
            We consider 40% of your monthly income as the maximum amount you can comfortably
            allocate towards EMI payments. The recommended budget includes a 15% buffer for
            additional costs like registration, stamp duty, and furnishing.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
