import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { colors } from '../constants/colors'
import { fonts } from '../constants/fonts'

const TermsAndPolicy = () => {
  const router = useRouter()

  const renderSection = (title: string, icon: keyof typeof Ionicons.glyphMap, children: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={24} color={colors.primary.green} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  )

  const renderSubsection = (title: string, content: string) => (
    <View style={styles.subsection}>
      <Text style={styles.subsectionTitle}>{title}</Text>
      <Text style={styles.bodyText}>{content}</Text>
    </View>
  )

  return (


    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introSection}>
        <Text style={styles.introText}>
          Welcome to Diracks. Please read these Terms and Conditions carefully
          before using our mobile application and services.
        </Text>
        <Text style={styles.lastUpdated}>
          Last Updated: January 2026
        </Text>
      </View>

      <View style={styles.divider} />

      {renderSection('Terms of Service', 'document-text-outline', (
        <>
          {renderSubsection('1. Acceptance of Terms', 'By accessing and using the Diracks mobile application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.')}
          {renderSubsection('2. Description of Service', 'Diracks is a mobile application that connects customers with service providers for various automotive and roadside assistance services including but not limited to towing, mechanical repairs, tire services, fuel delivery, and other related services.')}
          {renderSubsection('3. User Accounts', 'To use certain features of our service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.')}
          {renderSubsection('4. Service Bookings', 'When you book a service through Diracks, you enter into a contract with the service provider. Diracks acts as an intermediary platform connecting you with service providers. We are not responsible for the quality, safety, or legality of services provided by third-party service providers.')}
          {renderSubsection('5. Payment Terms', 'Payment for services is processed through our secure payment system. All prices are displayed in the app and are subject to change without notice. You agree to pay all charges associated with your use of the service.')}
          {renderSubsection('6. Cancellation Policy', 'You may cancel a service booking subject to the cancellation policy of the specific service provider. Cancellation fees may apply as determined by the service provider.')}

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>7. User Conduct</Text>
            <Text style={styles.bodyText}>You agree not to use the service to:</Text>
            <View style={styles.listContainer}>
              {['Violate any applicable laws or regulations', 'Infringe upon the rights of others', 'Transmit harmful or malicious code', 'Interfere with the operation of the service', 'Impersonate any person or entity'].map((item, index) => (
                <View key={index} style={styles.listItemRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {renderSubsection('8. Limitation of Liability', 'Diracks shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.')}
        </>
      ))}

      <View style={styles.divider} />

      {renderSection('Privacy Policy', 'shield-checkmark-outline', (
        <>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>1. Information We Collect</Text>
            <Text style={styles.bodyText}>We collect information that you provide directly to us, including:</Text>
            <View style={styles.listContainer}>
              {['Personal information (name, email, phone number)', 'Vehicle information and service history', 'Location data for service delivery', 'Payment information (processed securely)', 'Communication records and service feedback'].map((item, index) => (
                <View key={index} style={styles.listItemRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.bodyText}>We use the information we collect to:</Text>
            <View style={styles.listContainer}>
              {['Provide, maintain, and improve our services', 'Process transactions and send related information', 'Send service updates and notifications', 'Respond to your comments and questions', 'Monitor and analyze usage patterns'].map((item, index) => (
                <View key={index} style={styles.listItemRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>3. Information Sharing</Text>
            <Text style={styles.bodyText}>We may share your information with:</Text>
            <View style={styles.listContainer}>
              {['Service providers to fulfill your service requests', 'Payment processors for transaction processing', 'Legal authorities when required by law'].map((item, index) => (
                <View key={index} style={styles.listItemRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.bodyText, { marginTop: 8 }]}>We do not sell your personal information to third parties.</Text>
          </View>

          {renderSubsection('4. Data Security', 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.')}

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>5. Your Rights</Text>
            <Text style={styles.bodyText}>You have the right to:</Text>
            <View style={styles.listContainer}>
              {['Access and update your personal information', 'Request deletion of your account and data', 'Opt-out of marketing communications', 'Request a copy of your data'].map((item, index) => (
                <View key={index} style={styles.listItemRow}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {renderSubsection('6. Cookies and Tracking', 'We use cookies and similar tracking technologies to track activity on our app and store certain information. You can instruct your device to refuse all cookies or to indicate when a cookie is being sent.')}
        </>
      ))}

      <View style={styles.divider} />

      {renderSection('Contact Us', 'mail-outline', (
        <View style={styles.subsection}>
          <Text style={styles.bodyText}>
            If you have any questions about these Terms and Conditions or our
            Privacy Policy, please contact us:
          </Text>
          <View style={styles.contactContainer}>
            {[
              { icon: 'mail', text: 'support@diracks.com' },
              { icon: 'call', text: '+254 999 912 99' },
              { icon: 'location', text: 'Nairobi, Kenya' }
            ].map((item, index) => (
              <View key={index} style={styles.contactItem}>
                <View style={styles.contactIconCircle}>
                  <Ionicons name={item.icon as any} size={16} color={colors.primary.green} />
                </View>
                <Text style={styles.contactText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.subsectionTitle}>Changes to Terms</Text>
        <Text style={styles.bodyText}>
          We reserve the right to modify these terms at any time. We will
          notify users of any material changes by updating the "Last Updated"
          date at the top of this page. Your continued use of the service
          after such modifications constitutes acceptance of the updated
          terms.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2026 Diracks. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  )
}

export default TermsAndPolicy

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  introSection: {
    marginBottom: 24,
  },
  introText: {
    fontSize: 16,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: fonts.weights.medium,
    color: colors.text.secondary,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral.gray.lighter,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: fonts.weights.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15, // Increased slightly for readability
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.dark, // Softer black
    lineHeight: 24, // good breathing room
  },
  listContainer: {
    marginTop: 12,
    gap: 12,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.green,
    marginTop: 9,
  },
  listItem: {
    fontSize: 15,
    fontFamily: fonts.weights.regular,
    color: colors.neutral.gray.dark,
    lineHeight: 24,
    flex: 1,
  },
  contactContainer: {
    marginTop: 16,
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.gray.lightest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 15,
    fontFamily: fonts.weights.medium,
    color: colors.text.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.gray.lighter,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: fonts.weights.regular,
    color: colors.text.secondary,
  },
})
