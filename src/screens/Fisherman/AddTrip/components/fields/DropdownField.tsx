// src/screens/Fisherman/AddTrip/components/fields/DropdownField.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { s } from '../../styles';
import type { FormValues } from '../../types';

type OptionObj = { label: string; value: string | number };

type Props = {
  name: keyof FormValues;
  label: string;
  /**
   * Accepts either:
   *  - string[] (label=value)
   *  - {label, value}[]
   */
  options: Array<string | OptionObj>;
  placeholder?: string;
  rules?: any;
  disabled?: boolean;
};

export default function DropdownField({
  name,
  label,
  options,
  placeholder,
  rules,
  disabled = false,
}: Props) {
  const { control, formState: { errors } } = useFormContext<FormValues>();
  const [isOpen, setIsOpen] = useState(false);

  // Normalize to {label, value}
  const data: OptionObj[] = options.map((o) =>
    typeof o === 'string' ? ({ label: o, value: o }) : o
  );

  const hasErr = !!errors[name];
  const isRequired = !!(rules && typeof rules.required !== 'undefined');

  return (
    <View style={s.field}>
      <Text style={s.label}>
        {label}
        {isRequired && <Text style={{ color: '#EF4444' }}> *</Text>}
      </Text>

      <Controller
        name={name as any}
        control={control}
        rules={rules}
        render={({ field: { onChange, value } }) => {
          const selectedOption = data.find(option => option.value === value);
          
          return (
            <>
              <TouchableOpacity
                style={[s.dropdown, hasErr && s.inputError, disabled && { opacity: 0.6 }]}
                onPress={() => !disabled && setIsOpen(true)}
                disabled={disabled}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  width: '100%'
                }}>
                  <Text style={{ 
                    color: selectedOption ? '#000' : '#999', 
                    fontSize: 16,
                    flex: 1,
                    marginRight: 8
                  }}>
                    {selectedOption ? selectedOption.label : (placeholder ?? `Select ${label}`)}
                  </Text>
                  <Text style={{ 
                    color: '#666', 
                    fontSize: 16,
                    marginLeft: 'auto'
                  }}>▼</Text>
                </View>
              </TouchableOpacity>

              <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  activeOpacity={1}
                  onPress={() => setIsOpen(false)}
                >
                  <View
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      padding: 20,
                      width: '80%',
                      maxHeight: '60%',
                    }}
                    onStartShouldSetResponder={() => true}
                  >
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      marginBottom: 16,
                      textAlign: 'center',
                      color: '#000'
                    }}>
                      Select {label}
                    </Text>
                    
                    <FlatList
                      data={data}
                      keyExtractor={(item) => String(item.value)}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f0f0f0',
                          }}
                          onPress={() => {
                            onChange(item.value);
                            setIsOpen(false);
                          }}
                        >
                          <Text style={{
                            fontSize: 16,
                            color: '#000',
                            textAlign: 'center'
                          }}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                    
                    <TouchableOpacity
                      style={{
                        marginTop: 16,
                        paddingVertical: 12,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 8,
                        alignItems: 'center'
                      }}
                      onPress={() => setIsOpen(false)}
                    >
                      <Text style={{ color: '#666', fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          );
        }}
      />

      {hasErr && (
        <Text style={s.errorText}>
          {(errors as any)[name]?.message as string}
        </Text>
      )}
    </View>
  );
}
