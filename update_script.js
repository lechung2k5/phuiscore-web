const fs = require('fs');

let content = fs.readFileSync('packages/app/components/MatchSchedule.tsx', 'utf8');

// Replace fetchMatches
content = content.replace(
  /const fetchMatches = React\.useCallback\(async \(date: string, isPolling = false\) => \{[\s\S]*?\}, \[\]\)/,
  `const fetchMatches = React.useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true)
    try {
      const res = await axios.get(\`\${API_BASE_URL}/matches/all\`)
      if (res.data.success) {
        setLeagues(res.data.data)
      }
    } catch (error) {
      console.error('Lỗi cập nhật:', error)
    } finally {
      setLoading(false)
    }
  }, [])`
);

// Replace Socket matchUpdate
content = content.replace(
  /socket\.on\('matchUpdate', \(\) => \{\s*fetchMatches\(selectedDate, true\)\s*\}\)/,
  `socket.on('matchUpdate', () => {
        fetchMatches(true)
    })`
);

// Replace polling useEffect
content = content.replace(
  /fetchMatches\(selectedDate\)\s*const todayStr = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\s*let interval: any\s*if \(selectedDate === todayStr\) \{\s*interval = setInterval\(\(\) => \{\s*fetchMatches\(selectedDate, true\)\s*\}, 120000\)\s*\}\s*return \(\) => \{ if \(interval\) clearInterval\(interval\) \}/,
  `fetchMatches()

    const interval = setInterval(() => {
      fetchMatches(true) 
    }, 120000)

    return () => clearInterval(interval)`
);

// Replace useEffect dependencies
content = content.replace(/\[mounted, selectedDate, fetchMatches\]/g, '[mounted, fetchMatches]');

// Remove DatePicker block correctly
const startBlock = '<XS ai="center" jc="center" mb="$8" px={media.gtSm ? "$4" : "$2"} width="100%">';
const endBlock = `                </DLG.Content>
              </DLG.Portal>
            </DLG>
          </XS>
        </XS>`;

const startIdx = content.indexOf(startBlock);
const endIdx = content.indexOf(endBlock);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx + endBlock.length);
} else {
  console.log('Could not find DatePicker block');
}

// Keep useState but clean them up
// We should NOT remove states via regex because it might break if line breaks differ.
// Instead, let's just leave the states there. They are technically unused by JSX but it's safe and doesn't break the build if TypeScript allows it (or we can just replace their usage with dummy).
// Wait, TS will complain about unused vars.
content = content.replace(/const \[selectedDate, setSelectedDate\] = useState<string>\(\(\) => \{[\s\S]*?return localISOTime;\s*\}\)/, '');
content = content.replace(/const \[isDialogOpen, setIsDialogOpen\] = useState\(false\)/, '');
content = content.replace(/const dateRange = useMemo\(\(\) => \{[\s\S]*?\}, \[selectedDate, media\.gtMd\]\)/, '');
content = content.replace(/const handleStepDay = \(step: number\) => \{[\s\S]*?setSelectedDate\(d\.toISOString\(\)\.split\('T'\)\[0\]\)\s*\}/, '');

fs.writeFileSync('packages/app/components/MatchSchedule.tsx', content);
console.log('Update successful');
