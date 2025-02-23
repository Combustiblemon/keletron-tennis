import {
  ActionIcon,
  Box,
  Button,
  Card,
  CardSection,
  Divider,
  Group,
  LoadingOverlay,
  MultiSelect,
  NumberInput,
  Paper,
  rem,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure, useElementSize } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconClock,
  IconDeviceFloppy,
  IconFilter,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useRef, useState } from 'react';

import NewReservationForm from '@/components/forms/NewReservationForm/NewReservationForm';
import { useUser } from '@/components/UserProvider/UserProvider';
import { endpoints } from '@/lib/api/utils';
import { addMinutesToTime, iconStyles } from '@/lib/common';
import { useTranslation } from '@/lib/i18n/i18n';
import { CourtDataType } from '@/models/Court';

import { dayData, typeData } from '../common';
import ReservationInfoForm from './ReservationInfoForm';

const AdminCourts = () => {
  const [opened, { open, close }] = useDisclosure();
  const [
    newReservationFormOpened,
    { open: openNewReservationForm, close: closeNewReservationForm },
  ] = useDisclosure();
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const { t } = useTranslation('el');
  const { ref: wrapperRef, height: wrapperHeight } = useElementSize();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const courtForm = useForm({
    initialValues: {
      _id: '',
      name: '',
      reservationsInfo: {
        duration: 90,
        startTime: '09:00',
        endTime: '21:00',
        reservedTimes: [],
      },
      type: 'HARD',
    } satisfies CourtDataType as CourtDataType,
    validate: {
      name: (value) => {
        return !!value.trim() || 'name error';
      },
      reservationsInfo: {
        startTime: (value) => {
          const hour = Number(value.substring(0, 2));
          const minute = Number(value.substring(3, 5));

          const hourValid = !isNaN(hour) && hour >= 0 && hour <= 23;
          const minuteValid = !isNaN(minute) && minute >= 0 && minute <= 59;

          return (hourValid && minuteValid) || 'startTime invalid';
        },
        endTime: (value, values) => {
          const hour = Number(value.substring(0, 2));
          const minute = Number(value.substring(3, 5));

          const hourValid = !isNaN(hour) && hour >= 0 && hour <= 23;
          const minuteValid = !isNaN(minute) && minute >= 0 && minute <= 59;

          const afterStart = values.reservationsInfo.startTime <= value;

          return (hourValid && minuteValid && afterStart) || 'endTime invalid';
        },
        duration: (value) => {
          return value > 0 || 'duration error';
        },
      },
    },
  });

  const courts = useQuery({
    queryKey: ['courts'],
    queryFn: async () => endpoints.admin.courts(undefined).GET(),
  });

  const courtData = useMemo(
    () =>
      courts.data?.success ? (courts.data?.data as Array<CourtDataType>) : [],
    [courts]
  );

  const courtSelectionData = useMemo(() => {
    const courtSelection = courtData
      .map((c) => ({
        value: c._id,
        label: c.name,
      }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));

    if (!courtForm.getValues()._id && courtSelection[0]?.value) {
      courtForm.setValues(
        courtData.find((c) => c._id === courtSelection[0].value)!
      );
    }

    return courtSelection;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtData]);

  const selectedCourt = courtData.find(
    (c) => c._id === courtForm.getValues()._id
  );

  const startTimePicker = useMemo(
    () => (
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={() => {
          (startTimeRef.current as unknown as HTMLInputElement)?.showPicker();
        }}
      >
        <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
      </ActionIcon>
    ),
    []
  );

  const endTimePicker = useMemo(
    () => (
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={() => {
          (endTimeRef.current as unknown as HTMLInputElement)?.showPicker();
        }}
      >
        <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
      </ActionIcon>
    ),
    []
  );

  const [reservationFilters, setReservationFilters] = useState<{
    days:
      | CourtDataType['reservationsInfo']['reservedTimes'][number]['days']
      | null;
    type:
      | CourtDataType['reservationsInfo']['reservedTimes'][number]['type']
      | null;
  }>({ days: null, type: null });

  const [showFilter, setShowFilter] = useState(false);
  const [infoIndex, setInfoIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const saveCourt = async () => {
    setIsLoading(true);
    const res = await endpoints.admin
      .courts(courtForm.getValues()._id)
      .PUT(courtForm.getValues());

    if (!res?.success) {
      notifications.show({
        message: 'Σφάλμα κατά την αποθήκευση του Γηπέδου',
        color: 'red',
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: ['courts'],
      });

      notifications.show({
        message: 'Αποθήκευση επιτυχής',
        color: 'green',
      });
    }

    setIsLoading(false);
  };

  const courtsSelectionData = useMemo(
    () =>
      courts.data?.success
        ? courts.data?.data
            .map((court) => ({
              label: court.name,
              value: court._id as string,
            }))
            .sort((a, b) => (a.label > b.label ? 1 : -1))
        : [],
    [courts]
  );

  return (
    <>
      <ReservationInfoForm
        opened={opened}
        onClose={close}
        onSubmit={(values, index) => {
          courtForm.setFieldValue('reservationsInfo', {
            ...courtForm.getValues().reservationsInfo,
            reservedTimes: courtForm
              .getValues()
              .reservationsInfo?.reservedTimes.map((v, i) => {
                if (i === index) {
                  return values;
                }
                return v;
              }),
          });
        }}
        key={infoIndex}
        info={courtForm.getValues().reservationsInfo?.reservedTimes[infoIndex]}
        index={infoIndex}
      />
      <LoadingOverlay
        visible={isLoading || courts.isFetching}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />
      <NewReservationForm
        onClose={closeNewReservationForm}
        opened={newReservationFormOpened}
        userData={user}
        courtData={courts.data}
        courtsSelectionData={courtsSelectionData}
        isAdmin
      />
      <Box h="100%" flex={1} w="100%" ref={wrapperRef}>
        <ScrollArea
          h={wrapperHeight ? `${wrapperHeight}px` : '100%'}
          type="never"
          w="100%"
        >
          <Stack pt="sm">
            <Select
              label="Γήπεδο"
              defaultValue={courtSelectionData[0]?.value}
              data={courtSelectionData}
              onChange={(v) => {
                courtForm.reset();
                const court = courtData.find((c) => c._id === v);

                if (court) {
                  courtForm.setValues(court);
                }
              }}
              allowDeselect={false}
            />
            {!selectedCourt ? null : (
              <Card
                withBorder
                radius="md"
                shadow="sm"
                w="100%"
                key={selectedCourt._id}
                pos="relative"
              >
                <Box pos="absolute" top="8px" left="8px">
                  <Button variant="default" onClick={openNewReservationForm}>
                    Νέα κράτηση
                  </Button>
                </Box>
                <Box pos="absolute" top="8px" right="8px">
                  <Group>
                    {/* <ActionIcon
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('delete court')
                      }}
                      variant="subtle"
                      color="red"
                    >
                      <IconTrash style={iconStyles} />
                    </ActionIcon> */}
                    <ActionIcon
                      onClick={(e) => {
                        e.stopPropagation();
                        saveCourt();
                      }}
                      variant="subtle"
                      color="green"
                    >
                      <IconDeviceFloppy style={iconStyles} />
                    </ActionIcon>
                  </Group>
                </Box>
                <CardSection p="sm" pt="xl">
                  <Stack w="100%">
                    <TextInput
                      label="Όνομα"
                      defaultValue={selectedCourt.name}
                      onChange={(v) => {
                        courtForm.setFieldValue(
                          'name',
                          v.target.value.trim() || ''
                        );
                      }}
                    />
                    <Select
                      allowDeselect={false}
                      defaultValue={selectedCourt.type}
                      label="Τύπος γηπέδου"
                      data={[
                        { value: 'ASPHALT', label: 'Άσφαλτος' },
                        { value: 'HARD', label: 'Σκληρό' },
                      ]}
                      onChange={(v) => {
                        courtForm.setFieldValue('type', v as 'HARD');
                      }}
                    />
                    <NumberInput
                      label="Διάρκεια κράτησης"
                      defaultValue={selectedCourt.reservationsInfo?.duration}
                      onChange={(v) => {
                        courtForm.setFieldValue('reservationsInfo', {
                          ...courtForm.getValues().reservationsInfo,
                          duration: Number(v),
                        });
                      }}
                      allowDecimal={false}
                      trimLeadingZeroesOnBlur
                      allowNegative={false}
                      hideControls
                      suffix="λ"
                    />
                    <Group>
                      <TimeInput
                        inputMode="none"
                        ref={startTimeRef}
                        label="Ώρα αρχής"
                        defaultValue={selectedCourt.reservationsInfo?.startTime}
                        rightSection={startTimePicker}
                        onChange={(e) => {
                          courtForm.setFieldValue('reservationsInfo', {
                            ...courtForm.getValues().reservationsInfo,
                            startTime: e.target.value.trim(),
                          });
                        }}
                      />
                      <TimeInput
                        inputMode="none"
                        ref={endTimeRef}
                        label="Ώρα τέλους"
                        defaultValue={selectedCourt.reservationsInfo?.endTime}
                        rightSection={endTimePicker}
                        onChange={(e) => {
                          courtForm.setFieldValue('reservationsInfo', {
                            ...courtForm.getValues().reservationsInfo,
                            endTime: e.target.value.trim(),
                          });
                        }}
                      />
                    </Group>
                  </Stack>
                </CardSection>
                <Divider />
                <CardSection p="sm">
                  <Stack>
                    <Group justify="space-between">
                      <Text>Κρατημένες ώρες</Text>
                      <Group>
                        <ActionIcon
                          variant="subtle"
                          color="dark"
                          onClick={() => {
                            setShowFilter(!showFilter);
                          }}
                        >
                          <IconFilter
                            style={{ width: rem(16), height: rem(16) }}
                          />
                        </ActionIcon>

                        <ActionIcon
                          variant="subtle"
                          color="dark"
                          onClick={() => {
                            courtForm.setFieldValue('reservationsInfo', {
                              ...courtForm.getValues().reservationsInfo,
                              reservedTimes: [
                                ...courtForm.getValues().reservationsInfo
                                  .reservedTimes,
                                {
                                  duration:
                                    courtForm.getValues().reservationsInfo
                                      .duration,
                                  type: 'TRAINING',
                                  repeat: 'WEEKLY',
                                  startTime: '09:00',
                                  days: ['MONDAY'],
                                },
                              ],
                            });
                          }}
                        >
                          <IconPlus
                            style={{ width: rem(16), height: rem(16) }}
                          />
                        </ActionIcon>
                      </Group>
                    </Group>
                    {showFilter && (
                      <Stack>
                        <MultiSelect
                          label="Ημέρα"
                          data={dayData}
                          defaultValue={reservationFilters.days || []}
                          onChange={(v) => {
                            setReservationFilters({
                              ...reservationFilters,
                              days: v as Array<
                                (typeof dayData)[number]['value']
                              >,
                            });
                          }}
                        />
                        <Select
                          label="Τύπος"
                          data={typeData}
                          defaultValue={reservationFilters.type}
                          onChange={(v) => {
                            setReservationFilters({
                              ...reservationFilters,
                              type: v as
                                | (typeof typeData)[number]['value']
                                | null,
                            });
                          }}
                        />
                      </Stack>
                    )}
                    <Divider />
                    {courtForm
                      .getValues()
                      .reservationsInfo?.reservedTimes.filter((r) => {
                        if (
                          reservationFilters.days?.length &&
                          !reservationFilters.days.some((day) =>
                            r.days?.includes(day)
                          )
                        ) {
                          return false;
                        }

                        if (
                          reservationFilters.type &&
                          reservationFilters.type !== r.type
                        ) {
                          return false;
                        }

                        return true;
                      })
                      .map((res, i) => {
                        return (
                          <Paper
                            // eslint-disable-next-line react/no-array-index-key
                            key={`${JSON.stringify(res)}${i}`}
                            withBorder
                            p="sm"
                            shadow="md"
                            onClick={() => {
                              setInfoIndex(i);
                              open();
                            }}
                            pos="relative"
                          >
                            <Box pos="absolute" top="8px" right="8px">
                              <ActionIcon
                                onClick={(e) => {
                                  e.stopPropagation();
                                  courtForm.setFieldValue('reservationsInfo', {
                                    ...courtForm.getValues().reservationsInfo,
                                    reservedTimes: courtForm
                                      .getValues()
                                      .reservationsInfo?.reservedTimes.filter(
                                        (v, index) => {
                                          if (i === index) {
                                            return false;
                                          }
                                          return true;
                                        }
                                      ),
                                  });
                                }}
                                variant="subtle"
                                color="red"
                              >
                                <IconTrash style={iconStyles} />
                              </ActionIcon>
                            </Box>
                            <Stack>
                              <Text size="sm">Τύπος: {res.type}</Text>
                              <Text size="sm">
                                Ημέρες:{' '}
                                {res.days
                                  ?.map((day) => t(`generic.days.${day}`))
                                  .join(', ')}
                              </Text>
                              <Text size="sm">Επανάληψη: {res.repeat}</Text>
                              <Group gap="sm">
                                <Text size="sm">Αρχή: {res.startTime}</Text>
                                <Text size="sm">
                                  Εως:{' '}
                                  {(() => {
                                    return addMinutesToTime(
                                      res.startTime,
                                      res.duration
                                    );
                                  })()}
                                </Text>
                              </Group>
                              {!!res.datesNotApplied?.length && (
                                <Stack>
                                  <Text size="sm">Ημ/νίες μη ισχύουσες:</Text>
                                  <Text size="sm">
                                    {res.datesNotApplied.join(', ')}
                                  </Text>
                                </Stack>
                              )}
                              {res.notes && (
                                <Text size="sm">
                                  Σημειώσεις:
                                  <br />
                                  {res.notes}
                                </Text>
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                  </Stack>
                </CardSection>
              </Card>
            )}
          </Stack>
        </ScrollArea>
      </Box>
    </>
  );
};

export default AdminCourts;
