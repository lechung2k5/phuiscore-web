const fs = require('fs');
const path = 'packages/app/components/MatchSchedule.tsx';
let content = fs.readFileSync(path, 'utf8');

const datePickerBlock = `
        <XS ai="center" jc="center" mb="$8" px={media.gtSm ? "$4" : "$2"} width="100%">
          <XS
            backgroundColor="#111" borderWidth={1} borderColor={THEME_COLORS.borderDark}
            borderRadius={12} overflow="hidden" width="100%" height={84} elevation={4}
            flexDirection="row" alignItems="center"
          >
            <BTN unstyled width={58} ai="center" jc="center" onPress={() => handleStepDay(-1)} hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <ChevronLeft size={24} color="#888" />
            </BTN>

            <XS flex={1} flexDirection="row" alignItems="center">
              {dateRange.map((item: any) => {
                const isActive = selectedDate === item.full
                const isToday = item.full === new Date().toISOString().split('T')[0]
                return (
                  <BTN
                    key={item.full} unstyled onPress={() => setSelectedDate(item.full)}
                    backgroundColor="transparent" flex={1} ai="center" jc="center" paddingVertical="$3"
                    pressStyle={{ opacity: 0.7 }}
                  >
                    <YS ai="center" jc="center" gap="$2" position="relative">
                      <T color={isActive ? THEME_COLORS.logoGreen : (isToday ? "#aaa" : "#777")} fontSize={11} fontWeight="700">{item.dayName}</T>
                      <T color={isActive ? "#ffffff" : (isToday ? "#ddd" : "#bbb")} fontSize={20} fontWeight="900">{item.dateStr}</T>
                      {isActive && <View position="absolute" bottom={0} left={12} right={12} height={3} backgroundColor={THEME_COLORS.logoGreen} borderRadius={2} />}
                    </YS>
                  </BTN>
                )
              })}
            </XS>

            <BTN unstyled width={58} ai="center" jc="center" onPress={() => handleStepDay(1)} hoverStyle={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <ChevronRight size={24} color="#888" />
            </BTN>

            <SEP vertical height="55%" borderColor="#222" marginVertical="auto" />

            <DLG open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DLG.Trigger asChild>
                <BTN unstyled width={62} ai="center" jc="center" hoverStyle={{ backgroundColor: 'rgba(40,167,69,0.15)' }}>
                  <CalendarIcon size={24} color={THEME_COLORS.logoGreen} />
                </BTN>
              </DLG.Trigger>
              <Adapt when="sm" platform="touch">
                <SH modal dismissOnSnapToBottom>
                  <SH.Frame p="$4" backgroundColor={THEME_COLORS.bgDark} borderRadius={25}><Adapt.Contents /></SH.Frame>
                  <SH.Overlay backgroundColor="rgba(0,0,0,0.8)" />
                </SH>
              </Adapt>
              <DLG.Portal>
                <DLG.Overlay opacity={0.9} backgroundColor="black" animation="quick" />
                <DLG.Content backgroundColor="#fff" borderRadius="$6" padding="$0" width={380} alignSelf="center" elevate animation="quick">
                  <YS padding="$5" backgroundColor="white" borderTopLeftRadius={24} borderTopRightRadius={24} borderBottomWidth={1} borderColor="#eee">
                    <XS justifyContent="space-between" alignItems="center" marginBottom="$4">
                      <BTN unstyled onPress={() => handleStepDay(-30)}><ChevronLeft size={20} color="black" /></BTN>
                      <T color="black" fontWeight="900" fontSize={18}>Chọn Ngày</T>
                      <BTN unstyled onPress={() => handleStepDay(30)}><ChevronRight size={20} color="black" /></BTN>
                    </XS>
                    <IPT type="date" value={selectedDate} onChange={(e: any) => setSelectedDate(e.target.value)} backgroundColor="#f5f5f5" color="black" fontSize={16} height={55} borderWidth={0} borderRadius="$3" paddingHorizontal="$4" />
                  </YS>
                  <YS padding="$4" backgroundColor="white" borderBottomLeftRadius={24} borderBottomRightRadius={24}>
                    <BTN backgroundColor={THEME_COLORS.logoGreen} onPress={() => setIsDialogOpen(false)} height={55} borderRadius="$3">
                      <T color="white" fontWeight="900">XÁC NHẬN</T>
                    </BTN>
                  </YS>
                </DLG.Content>
              </DLG.Portal>
            </DLG>
          </XS>
        </XS>
`;

content = content.replace('{/* Date picker removed to display all matches */}', datePickerBlock);
content = content.replace('axios.get(`${API_BASE_URL}/matches/all`)', 'axios.get(`${API_BASE_URL}/matches/${selectedDate}`)');

fs.writeFileSync(path, content);
console.log('DatePicker restored!');
