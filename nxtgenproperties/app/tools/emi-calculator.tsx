import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

export default function EMICalculatorScreen() {
  const router = useRouter();
  
  // State for loan details
  const [loanAmount, setLoanAmount] = useState(5000000); // 50 Lakh
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20); // Years
  
  // Calculate EMI
  const emiDetails = useMemo(() => {
    const principal = loanAmount;
    const monthlyRate = interestRate / 12 / 100;
    const numberOfPayments = loanTenure * 12;
    
    // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
    const emi = 
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    const totalPayment = emi * numberOfPayments;
    const totalInterest = totalPayment - principal;
    
    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      principal: principal,
    };
  }, [loanAmount, interestRate, loanTenure]);

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

  // Calculate pie chart percentages
  const principalPercent = (emiDetails.principal / emiDetails.totalPayment) * 100;
  const interestPercent = (emiDetails.totalInterest / emiDetails.totalPayment) * 100;

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
        <Text className="text-gray-900 text-xl font-bold">EMI Calculator</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* EMI Display Card */}
        <View className="bg-accent mx-5 mt-5 rounded-2xl p-6">
          <Text className="text-white/80 text-sm mb-2">Your Monthly EMI</Text>
          <Text className="text-white text-4xl font-bold">
            {formatCurrencyFull(emiDetails.emi)}
          </Text>
          <View className="flex-row mt-4">
            <View className="flex-1">
              <Text className="text-white/70 text-xs">Total Interest</Text>
              <Text className="text-white text-lg font-semibold">
                {formatCurrency(emiDetails.totalInterest)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/70 text-xs">Total Payment</Text>
              <Text className="text-white text-lg font-semibold">
                {formatCurrency(emiDetails.totalPayment)}
              </Text>
            </View>
          </View>
        </View>

        {/* Breakdown Visual */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5">
          <Text className="text-gray-900 text-lg font-bold mb-4">Payment Breakdown</Text>
          
          {/* Progress Bar */}
          <View className="h-6 bg-gray-100 rounded-full overflow-hidden flex-row mb-4">
            <View 
              className="bg-primary h-full" 
              style={{ width: `${principalPercent}%` }} 
            />
            <View 
              className="bg-orange-400 h-full" 
              style={{ width: `${interestPercent}%` }} 
            />
          </View>

          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-primary rounded-full mr-2" />
              <Text className="text-gray-600 text-sm">Principal ({principalPercent.toFixed(0)}%)</Text>
            </View>
            <Text className="text-gray-900 font-semibold">{formatCurrency(emiDetails.principal)}</Text>
          </View>
          
          <View className="flex-row justify-between mt-2">
            <View className="flex-row items-center">
              <View className="w-3 h-3 bg-orange-400 rounded-full mr-2" />
              <Text className="text-gray-600 text-sm">Interest ({interestPercent.toFixed(0)}%)</Text>
            </View>
            <Text className="text-gray-900 font-semibold">{formatCurrency(emiDetails.totalInterest)}</Text>
          </View>
        </View>

        {/* Loan Amount Slider */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-base font-semibold">Loan Amount</Text>
            <View className="bg-orange-50 px-3 py-1 rounded-lg">
              <Text className="text-primary font-bold">{formatCurrency(loanAmount)}</Text>
            </View>
          </View>
          
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={500000}
            maximumValue={100000000}
            step={100000}
            value={loanAmount}
            onValueChange={setLoanAmount}
            minimumTrackTintColor="#FF6B35"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#FF6B35"
          />
          
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-xs">₹5 L</Text>
            <Text className="text-gray-400 text-xs">₹10 Cr</Text>
          </View>
        </View>

        {/* Interest Rate Slider */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-base font-semibold">Interest Rate (p.a.)</Text>
            <View className="bg-orange-50 px-3 py-1 rounded-lg">
              <Text className="text-primary font-bold">{interestRate.toFixed(1)}%</Text>
            </View>
          </View>
          
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={5}
            maximumValue={20}
            step={0.1}
            value={interestRate}
            onValueChange={setInterestRate}
            minimumTrackTintColor="#FF6B35"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#FF6B35"
          />
          
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-xs">5%</Text>
            <Text className="text-gray-400 text-xs">20%</Text>
          </View>
        </View>

        {/* Loan Tenure Slider */}
        <View className="bg-white mx-5 mt-4 rounded-2xl p-5 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-900 text-base font-semibold">Loan Tenure</Text>
            <View className="bg-orange-50 px-3 py-1 rounded-lg">
              <Text className="text-primary font-bold">{loanTenure} Years</Text>
            </View>
          </View>
          
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={1}
            maximumValue={30}
            step={1}
            value={loanTenure}
            onValueChange={setLoanTenure}
            minimumTrackTintColor="#FF6B35"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#FF6B35"
          />
          
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-xs">1 Year</Text>
            <Text className="text-gray-400 text-xs">30 Years</Text>
          </View>
        </View>

        {/* Quick Tips */}
        <View className="bg-orange-50 mx-5 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bulb" size={20} color="#FF6B35" />
            <Text className="text-gray-900 font-semibold ml-2">Tips to Reduce EMI</Text>
          </View>
          <View className="space-y-2">
            <View className="flex-row items-start">
              <Text className="text-primary mr-2">•</Text>
              <Text className="text-gray-600 text-sm flex-1">Increase down payment to reduce loan amount</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-primary mr-2">•</Text>
              <Text className="text-gray-600 text-sm flex-1">Opt for longer tenure for lower EMI (but higher total interest)</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-primary mr-2">•</Text>
              <Text className="text-gray-600 text-sm flex-1">Compare rates from multiple banks to get the best deal</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
