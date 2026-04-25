'use client'

import React from 'react'
import { YStack } from 'tamagui'
// Import cái màn hình StandingsScreen mình vừa hoàn thiện ở bước trước
import  StandingsScreen  from 'app/components/Standings/StandingsScreen'

const Container: any = YStack;

export default function StandingsPage() {
    return (
        <Container 
            flex={1} 
            backgroundColor={"$background" as any}
        >
            {/* Mặc định tôi để tournamentId={17} là Ngoại hạng Anh. 
                Sau này ông có thể lấy ID từ URL (params) để hiện các giải khác.
            */}
            <StandingsScreen  />
        </Container>
    )
}