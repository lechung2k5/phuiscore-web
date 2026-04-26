import { XStack, Text, Button, H3 } from 'tamagui'
import { Home, Trophy, LogIn } from '@tamagui/lucide-icons'

export const Navbar = () => {
    return (
        <XStack
            padding="$4"
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth={1}
            borderColor="$borderColor"
            backgroundColor="$background"
        >
            <H3 fontWeight="900" color="$green10">PHUISCORE</H3>

            <XStack gap="$4" $sm={{ display: 'none' }}>
                <Button chromeless icon={Home}>Trang chủ</Button>
                <Button chromeless icon={Trophy}>Giải đấu</Button>
            </XStack>

            <Button theme="green" icon={LogIn} borderRadius="$10">
                Đăng nhập
            </Button>
        </XStack>
    )
}

