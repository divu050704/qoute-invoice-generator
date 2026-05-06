import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PencilLine, Plus, Building2 } from 'lucide-react-native';

const LOGO_ASSETS = {
  progardenlogo: require('../../../assets/progardenlogo.png'),
  hardendramalogo: require('../../../assets/hardendramalogo.png'),
  Vgilogo: require('../../../assets/Vgilogo.png'),
};

export default function EntitySelector({
  title,
  icon,
  iconBg,
  entityName,
  entitySub,
  entityPhone,
  onPress,
  actionText,
  actionColor,
  hasData,
  isDark,
  logoUrl,
  logoKey,
  onEditDetails,
  rightAction,
  containerStyle
}) {
  const cardBg = isDark ? '#1E1E1E' : '#FFF';
  const cardBorder = isDark ? '#2C2C2E' : '#F1F5F9';
  const textMain = isDark ? '#F5F5F5' : '#0F172A';
  const textSubColor = isDark ? '#A1A1AA' : '#64748B';

  return (
    <View style={containerStyle}>
      {title && (
        <Text style={[styles.sectionHeaderLabel, { color: textSubColor }]}>{title}</Text>
      )}
      <View style={[styles.entityCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.entityLeft}>
          <View style={[styles.entityIcon, { backgroundColor: iconBg }, (logoUrl || logoKey) && styles.logoIcon]}>
            {(logoUrl || logoKey) ? (
              <Image 
                source={logoKey ? LOGO_ASSETS[logoKey] : { uri: logoUrl }} 
                style={{ width: '80%', height: '80%', resizeMode: 'contain' }} 
              />
            ) : icon}
          </View>
          <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
            <Text style={[styles.entityName, { color: textMain }]} numberOfLines={1}>
              {entityName}
            </Text>
            
            {onEditDetails && (
              <TouchableOpacity onPress={onEditDetails} style={styles.editDetailsBtn}>
                <PencilLine size={11} color="#134E3A" />
                <Text style={styles.editDetailsText}>Edit Details</Text>
              </TouchableOpacity>
            )}
            
            {entitySub ? (
              <Text style={[styles.entitySub, { color: textSubColor }]} numberOfLines={2}>
                {entitySub} {entityPhone ? `• ${entityPhone}` : ''}
              </Text>
            ) : null}
          </View>
        </View>
        
        {rightAction ? (
          rightAction
        ) : (
          <TouchableOpacity 
            onPress={onPress} 
            style={[styles.actionChip, { backgroundColor: `${iconBg}` }]}
          >
            {hasData ? <PencilLine size={13} color={actionColor} /> : <Plus size={13} color={actionColor} />}
            <Text style={[styles.actionChipText, { color: actionColor }]}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginBottom: 10, 
    paddingHorizontal: 2 
  },
  entityCard: { 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderWidth: 1, 
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.02, 
    shadowRadius: 4 
  },
  entityLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  entityIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logoIcon: {
    backgroundColor: '#FFF', 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#E2E8F0'
  },
  entityName: { 
    fontSize: 15, 
    fontWeight: '700', 
    marginBottom: 2 
  },
  entitySub: { 
    fontSize: 11, 
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18
  },
  actionChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  actionChipText: { 
    fontSize: 11, 
    fontWeight: '700' 
  },
  editDetailsBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 4
  },
  editDetailsText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#134E3A' 
  }
});
