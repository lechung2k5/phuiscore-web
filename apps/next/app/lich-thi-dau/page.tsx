'use client'

import React from 'react'
import { YStack } from 'tamagui'
import MatchSchedule from 'app/components/MatchSchedule'

const Container: any = YStack;

export default function MatchSchedulePage() {
    return (
        <Container f={1} bc={"$background" as any}>
            <MatchSchedule />
        </Container>
    )
}