const fs = require('fs');

const path = 'packages/app/components/MatchSchedule.tsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Replace fetchMatches signature and body
  if (line.includes('const fetchMatches = React.useCallback(async (date: string, isPolling = false) => {')) {
    newLines.push('  const fetchMatches = React.useCallback(async (isPolling = false) => {');
    newLines.push('    if (!isPolling) setLoading(true)');
    newLines.push('    try {');
    newLines.push('      const res = await axios.get(`${API_BASE_URL}/matches/all`)');
    newLines.push('      if (res.data.success) {');
    newLines.push('        setLeagues(res.data.data)');
    newLines.push('      }');
    newLines.push('    } catch (error) {');
    newLines.push('      console.error("Lỗi cập nhật:", error)');
    newLines.push('    } finally {');
    newLines.push('      setLoading(false)');
    newLines.push('    }');
    newLines.push('  }, [])');
    
    // skip until we reach the end of the original fetchMatches
    let braces = 1;
    i++;
    while (i < lines.length) {
      if (lines[i].includes('{')) braces += (lines[i].match(/{/g) || []).length;
      if (lines[i].includes('}')) braces -= (lines[i].match(/}/g) || []).length;
      if (braces <= 0 && lines[i].includes('}, [])')) {
        break;
      }
      i++;
    }
    continue;
  }

  // Replace socket matchUpdate
  if (line.includes("socket.on('matchUpdate', () => {")) {
    newLines.push("    socket.on('matchUpdate', () => {");
    newLines.push("        fetchMatches(true)");
    newLines.push("    })");
    // skip the original inner
    i += 2;
    continue;
  }

  // Replace dependencies in socket.io useEffect
  if (line.includes('}, [mounted, selectedDate, fetchMatches])')) {
    newLines.push("  }, [mounted, fetchMatches])");
    continue;
  }

  // Replace polling interval block
  if (line.includes('// Tự động cập nhật mỗi 2 phút một lần (Dự phòng cho Socket)')) {
    newLines.push('  // Tự động cập nhật mỗi 2 phút một lần (Dự phòng cho Socket)');
    newLines.push('  useEffect(() => {');
    newLines.push('    if (!mounted) return');
    newLines.push('    ');
    newLines.push('    fetchMatches()');
    newLines.push('    const interval = setInterval(() => {');
    newLines.push('      fetchMatches(true)');
    newLines.push('    }, 120000)');
    newLines.push('    return () => clearInterval(interval)');
    newLines.push('  }, [mounted, fetchMatches])');
    
    // skip original useEffect body
    while (i < lines.length && !lines[i].includes('}, [selectedDate, mounted, fetchMatches])')) {
      i++;
    }
    continue;
  }

  // Remove DatePicker UI
  if (line.includes('<XS ai="center" jc="center" mb="$8" px={media.gtSm ? "$4" : "$2"} width="100%">')) {
    newLines.push('        {/* Date picker removed to display all matches */}');
    // skip until the closing tag of this XS
    let xsCount = 1;
    i++;
    while (i < lines.length) {
      if (lines[i].includes('<XS')) xsCount += (lines[i].match(/<XS/g) || []).length;
      if (lines[i].includes('</XS>')) xsCount -= (lines[i].match(/<\/XS>/g) || []).length;
      if (xsCount <= 0) {
        break;
      }
      i++;
    }
    continue;
  }

  newLines.push(line);
}

fs.writeFileSync(path, newLines.join('\n'));
console.log('Update complete via node script!');
