import React from 'react';
import {Alert, I18nManager, Pressable, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useDemoStore} from '../store/demoStore';
import DemoTooltip from '../components/common/DemoTooltip';
import DemoFloatingBar from '../components/common/DemoFloatingBar';

import type {RootStackParamList} from '../navigation/RootNavigator';
import {useDemoData} from '../store/demoDataStore';
import {useToastStore} from '../store/toastStore';
import Icon from '../components/common/Icon';
import {colors, shadows} from '../theme/designSystem';
import CategoryIcon from '../components/common/CategoryIcon';
import SectionHeader from '../components/common/SectionHeader';
import {getLocalizedField, formatCurrency} from '../utils/arabicFormatters';
import type {Job} from '../../../shared/types/demo';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'JobTracking'>;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
}

const getJobStatusConfig = (status: string) => {
  const configs: Record<string, {labelAr: string; labelEn: string; color: string}> = {
    pending_start: {labelAr: 'قيد الانتظار', labelEn: 'Pending Start', color: '#64748B'},
    in_progress:   {labelAr: 'جارية',        labelEn: 'In Progress',   color: colors.warning},
    paused:        {labelAr: 'متوقفة',       labelEn: 'Paused',        color: '#E67E3A'},
    completed:     {labelAr: 'مكتملة',       labelEn: 'Completed',     color: colors.success},
    cancelled:     {labelAr: 'ملغاة',        labelEn: 'Cancelled',     color: colors.error},
    disputed:      {labelAr: 'متنازع عليها', labelEn: 'Disputed',      color: '#E67E3A'},
  };
  return configs[status] ?? configs.pending_start;
};

export default function JobTrackingScreen() {
  const {i18n} = useTranslation();
  const {t: tDemo} = useTranslation('demo');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {showToast} = useToastStore();
  const isAr = i18n.language === 'ar';
  const {isActive, currentStep, nextStep} = useDemoStore();

  const {jobId} = route.params;
  const jobs = useDemoData(s => s.jobs);
  const completeJob = useDemoData(s => s.completeJob);
  const cancelJob = useDemoData(s => s.cancelJob);
  const completeJobMilestone = useDemoData(s => s.completeJobMilestone);
  const getSupplierById = useDemoData(s => s.getSupplierById);

  const job: Job | undefined = jobs.find(j => j.id === jobId);

  if (!job) {
    return (
      <View style={{flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center'}}>
        <Icon name="alert-circle-outline" size={48} color={colors.textSecondary} />
        <Text style={{fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 16}}>
          {isAr ? 'العمل غير موجود' : 'Job not found'}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 12}}
        >
          <Text style={{color: '#FFFFFF', fontWeight: '600'}}>{isAr ? 'رجوع' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const supplier = getSupplierById(job.supplierId);
  const statusCfg = getJobStatusConfig(job.status);
  const progressPct = job.progress;
  const isCompleted = job.status === 'completed';
  const isCancelled = job.status === 'cancelled';
  const isDone = isCompleted || isCancelled;

  const handleCompleteJob = () => {
    Alert.alert(
      isAr ? 'إتمام العمل' : 'Complete Job',
      isAr ? 'هل أنت متأكد من إتمام هذا العمل؟' : 'Are you sure you want to mark this job as completed?',
      [
        {text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel'},
        {
          text: isAr ? 'إتمام' : 'Complete',
          onPress: () => {
            completeJob(job.id);
            showToast(isAr ? 'تم إتمام العمل بنجاح' : 'Job completed successfully', 'success');
          },
        },
      ],
    );
  };

  const handleCancelJob = () => {
    Alert.alert(
      isAr ? 'إلغاء العمل' : 'Cancel Job',
      isAr ? 'هل أنت متأكد من إلغاء هذا العمل؟' : 'Are you sure you want to cancel this job?',
      [
        {text: isAr ? 'لا' : 'No', style: 'cancel'},
        {
          text: isAr ? 'إلغاء العمل' : 'Cancel Job',
          style: 'destructive',
          onPress: () => {
            cancelJob(job.id);
            showToast(isAr ? 'تم إلغاء العمل' : 'Job cancelled', 'info');
          },
        },
      ],
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: '#F8FAFC'}}>
      {/* HEADER */}
      <View style={{backgroundColor: '#101828', paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 16}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{marginEnd: 12, padding: 4}}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            activeOpacity={0.7}
          >
            <View style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={{flex: 1}}>
            <Text style={{fontSize: 18, fontWeight: '600', color: '#FFFFFF'}} numberOfLines={1}>
              {getLocalizedField(job, 'title')}
            </Text>
            <Text style={{fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2}}>
              {getLocalizedField(job, 'city')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => showToast('Sharing...', 'info')}
            style={{padding: 4}}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            activeOpacity={0.7}
          >
            <Icon name="share-variant" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Status chip + amount */}
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10}}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Icon
              name={isCompleted ? 'check-circle' : isCancelled ? 'close-circle' : 'progress-clock'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={{fontSize: 13, fontWeight: '600', color: '#FFFFFF'}}>
              {isAr ? statusCfg.labelAr : statusCfg.labelEn}
            </Text>
          </View>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
          }}>
            <Text style={{fontSize: 13, fontWeight: '600', color: '#FFFFFF'}}>
              {formatCurrency(job.amount)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: isDone ? 40 : 100, marginTop: -8}}
      >
        {/* COMPLETED BANNER */}
        {isCompleted && (
          <View style={{
            backgroundColor: '#DCFCE7', marginHorizontal: 16, marginTop: 12,
            borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Icon name="check-circle" size={22} color={colors.success} />
            <View style={{flex: 1}}>
              <Text style={{fontSize: 14, fontWeight: '600', color: '#166534'}}>
                {isAr ? 'تم إتمام العمل بنجاح' : 'Job Completed Successfully'}
              </Text>
              <Text style={{fontSize: 12, color: '#166534', marginTop: 2}}>
                {job.completionDate ? fmtDate(job.completionDate) : ''}
              </Text>
            </View>
          </View>
        )}

        {/* CANCELLED BANNER */}
        {isCancelled && (
          <View style={{
            backgroundColor: '#FEE2E2', marginHorizontal: 16, marginTop: 12,
            borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Icon name="close-circle" size={22} color={colors.error} />
            <Text style={{fontSize: 14, fontWeight: '600', color: '#991B1B'}}>
              {isAr ? 'تم إلغاء العمل' : 'Job Cancelled'}
            </Text>
          </View>
        )}

        {/* TIMELINE CARD */}
        <View style={[{
          backgroundColor: '#FFFFFF', borderRadius: 20,
          marginHorizontal: 16, marginTop: 12, padding: 16,
          borderWidth: 1, borderColor: '#E2E8F0',
        }, shadows.md]}>
          <SectionHeader title={isAr ? 'التقدم' : 'Progress'} iconName="calendar-range" />

          <View style={{marginTop: 12}}>
            <View style={{height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden'}}>
              <View style={{
                width: `${progressPct}%`,
                height: 8,
                backgroundColor: isCompleted ? colors.success : colors.warning,
                borderRadius: 4,
              }} />
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 6}}>
              <Text style={{fontSize: 11, color: colors.textSecondary}}>{fmtDate(job.startDate)}</Text>
              <Text style={{fontSize: 11, fontWeight: '600', color: isCompleted ? colors.success : colors.warning}}>
                {progressPct}%
              </Text>
              <Text style={{fontSize: 11, color: colors.textSecondary}}>
                {job.completionDate ? fmtDate(job.completionDate) : isAr ? 'جارية' : 'Ongoing'}
              </Text>
            </View>
          </View>
        </View>

        {/* MILESTONES */}
        {job.milestones.length > 0 && (
          <View style={[{
            backgroundColor: '#FFFFFF', borderRadius: 20,
            marginHorizontal: 16, marginTop: 12, padding: 16,
            borderWidth: 1, borderColor: '#E2E8F0',
          }, shadows.sm]}>
            <SectionHeader title={isAr ? 'المراحل' : 'Milestones'} iconName="flag-checkered" />

            <View style={{marginTop: 12, gap: 8}}>
              {job.milestones.map((milestone, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    if (!milestone.completed && !isDone) {
                      completeJobMilestone(job.id, index);
                    }
                  }}
                  style={[{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: milestone.completed ? '#F0FDF4' : '#F8FAFC',
                    borderRadius: 12, padding: 12,
                    borderWidth: 1,
                    borderColor: milestone.completed ? '#BBF7D0' : '#E2E8F0',
                  }]}
                >
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: milestone.completed ? colors.success : '#E2E8F0',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon
                      name={milestone.completed ? 'check' : 'circle-outline'}
                      size={16}
                      color={milestone.completed ? '#FFFFFF' : colors.textSecondary}
                    />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={{
                      fontSize: 13, fontWeight: '600',
                      color: milestone.completed ? '#166634' : colors.textPrimary,
                    }}>
                      {isAr ? milestone.nameAr : milestone.name}
                    </Text>
                    {milestone.date && (
                      <Text style={{fontSize: 11, color: colors.textSecondary, marginTop: 2}}>
                        {fmtDate(milestone.date)}
                      </Text>
                    )}
                  </View>
                  {!milestone.completed && !isDone && (
                    <Text style={{fontSize: 11, color: colors.primary, fontWeight: '600'}}>
                      {isAr ? 'اضغط للإتمام' : 'Tap to complete'}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SUPPLIER CONTACT */}
        <View style={[{
          backgroundColor: '#FFFFFF', borderRadius: 20,
          marginHorizontal: 16, marginTop: 12, padding: 16,
          borderWidth: 1, borderColor: '#E2E8F0',
        }, shadows.sm]}>
          <SectionHeader title={isAr ? 'المورد' : 'Supplier'} iconName="account-tie" />

          <View style={{marginTop: 12}}>
            {supplier ? (
              <View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CategoryIcon category={job.category} size={20} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 15, fontWeight: '600', color: colors.textPrimary}}>
                      {isAr ? supplier.nameAr : supplier.name}
                    </Text>
                    <Text style={{fontSize: 12, color: colors.textSecondary, marginTop: 2}}>
                      {isAr ? supplier.cityAr : supplier.city}
                    </Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 3}}>
                    <Icon name="star" size={13} color="#F59E0B" />
                    <Text style={{fontSize: 12, fontWeight: '600', color: colors.textPrimary}}>
                      {supplier.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: '#DCFCE7', borderRadius: 12,
                    paddingHorizontal: 16, paddingVertical: 12, marginTop: 12,
                  }}
                  activeOpacity={0.8}
                  onPress={() => showToast(`Calling ${supplier.phone}`, 'success')}
                >
                  <Icon name="phone" size={18} color={colors.success} />
                  <Text style={{fontSize: 15, fontWeight: '600', color: colors.success}}>
                    {supplier.phone}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="account-tie" size={22} color={colors.textSecondary} />
                </View>
                <Text style={{fontSize: 14, color: colors.textSecondary}}>
                  {isAr ? 'المورد غير موجود' : 'Supplier not found'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* JOB DETAILS */}
        <View style={[{
          backgroundColor: '#FFFFFF', borderRadius: 20,
          marginHorizontal: 16, marginTop: 12, padding: 16,
          borderWidth: 1, borderColor: '#E2E8F0',
        }, shadows.sm]}>
          <SectionHeader title={isAr ? 'تفاصيل العمل' : 'Job Details'} iconName="briefcase-outline" />

          <View style={{marginTop: 12, gap: 10}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{fontSize: 13, color: colors.textSecondary}}>{isAr ? 'الفئة' : 'Category'}</Text>
              <Text style={{fontSize: 13, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize'}}>
                {job.category}
              </Text>
            </View>
            <View style={{height: 1, backgroundColor: '#E2E8F0'}} />
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{fontSize: 13, color: colors.textSecondary}}>{isAr ? 'المبلغ' : 'Amount'}</Text>
              <Text style={{fontSize: 13, fontWeight: '600', color: colors.primary}}>
                {formatCurrency(job.amount)}
              </Text>
            </View>
            <View style={{height: 1, backgroundColor: '#E2E8F0'}} />
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={{fontSize: 13, color: colors.textSecondary}}>{isAr ? 'تاريخ البدء' : 'Start Date'}</Text>
              <Text style={{fontSize: 13, fontWeight: '600', color: colors.textPrimary}}>
                {fmtDate(job.startDate)}
              </Text>
            </View>
            {job.completionDate && (
              <>
                <View style={{height: 1, backgroundColor: '#E2E8F0'}} />
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={{fontSize: 13, color: colors.textSecondary}}>{isAr ? 'تاريخ الإتمام' : 'Completion'}</Text>
                  <Text style={{fontSize: 13, fontWeight: '600', color: colors.success}}>
                    {fmtDate(job.completionDate)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* STICKY COMPLETE / CANCEL BUTTONS */}
      {!isDone && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          flexDirection: 'row', gap: 10,
          borderTopWidth: 1, borderTopColor: '#E2E8F0',
        }}>
          <TouchableOpacity
            onPress={handleCancelJob}
            activeOpacity={0.85}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 14,
              backgroundColor: '#FEE2E2',
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 6,
            }}
          >
            <Icon name="close-circle-outline" size={18} color={colors.error} />
            <Text style={{fontSize: 15, fontWeight: '600', color: colors.error}}>
              {isAr ? 'إلغاء' : 'Cancel Job'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCompleteJob}
            activeOpacity={0.85}
            style={{
              flex: 2, paddingVertical: 14, borderRadius: 14,
              backgroundColor: colors.success,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 6,
            }}
          >
            <Icon name="check-circle-outline" size={18} color="#FFFFFF" />
            <Text style={{fontSize: 15, fontWeight: '600', color: '#FFFFFF'}}>
              {isAr ? 'إتمام العمل' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DEMO TOOLTIPS */}
      <DemoTooltip
        visible={isActive && currentStep === 'job_tracking'}
        stepNumber={15} totalSteps={18}
        title={tDemo('tour.job_tracking.title')}
        description={tDemo('tour.job_tracking.description')}
        onNext={nextStep}
      />
      <DemoTooltip
        visible={isActive && currentStep === 'job_completed'}
        stepNumber={16} totalSteps={18}
        title={tDemo('tour.job_completed.title')}
        description={tDemo('tour.job_completed.description')}
        onNext={() => {
          nextStep();
          navigation.navigate('Review', {jobId: 'JOB_001', supplierId: 'S001'});
        }}
      />

      <DemoFloatingBar />
    </View>
  );
}
