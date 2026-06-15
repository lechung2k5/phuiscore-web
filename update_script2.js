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

// Replace socket on matchUpdate
content = content.replace(
  /socket\.on\('matchUpdate', \(\) => \{\n\s*fetchMatches\(selectedDate, true\)\n\s*\}\)/,
  `socket.on('matchUpdate', () => {
        fetchMatches(true)
    })`
);

// Replace dependency array in socket effect
content = content.replace(/\[mounted, selectedDate, fetchMatches\]/, '[mounted, fetchMatches]');

// Replace polling useEffect
content = content.replace(
  /fetchMatches\(selectedDate\)\n\n\s*const todayStr = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\n\s*let interval: any\n\n\s*if \(selectedDate === todayStr\) \{\n\s*interval = setInterval\(\(\) => \{\n\s*fetchMatches\(selectedDate, true\)\s*\n\s*\}, 120000\)\n\s*\}\n\n\s*return \(\) => \{ if \(interval\) clearInterval\(interval\) \}/,
  `fetchMatches()

    const interval = setInterval(() => {
      fetchMatches(true) 
    }, 120000)

    return () => clearInterval(interval)`
);

// Replace unused state variables
content = content.replace(/const \[selectedDate, setSelectedDate\] = useState<string>\(\(\) => \{[\s\S]*?return localISOTime;\n  \}\)/, '');
content = content.replace(/const \[isDialogOpen, setIsDialogOpen\] = useState\(false\)/, '');
content = content.replace(/const dateRange = useMemo\(\(\) => \{[\s\S]*?\}, \[selectedDate, media\.gtMd\]\)/, '');
content = content.replace(/const handleStepDay = \(step: number\) => \{[\s\S]*?setSelectedDate\(d\.toISOString\(\)\.split\('T'\)\[0\]\)\n  \}/, '');

fs.writeFileSync('packages/app/components/MatchSchedule.tsx', content);
console.log('Update successful');
