import { YStack, Button, Text } from 'tamagui'
import { Home, Trophy, Users, Settings, Layout } from '@tamagui/lucide-icons'

export const Sidebar = ({ role }) => {
    return (
        <YStack width={250} borderRightWidth={1} borderColor="$borderColor" padding="$4" gap="$2">
            <Button icon={Home} chromeless justifyContent="flex-start">Trang chủ</Button>
            <Button icon={Trophy} chromeless justifyContent="flex-start">Giải đấu</Button>

            {/* Menu cho Đội trưởng / Người dùng Premium */}
            {(role === 'CAPTAIN' || role === 'ADMIN') && (
                <>
                    <Text color="$colorFocus" fontSize="$2" paddingLeft="$3" marginTop="$4">QUẢN LÝ ĐỘI</Text>
                    <Button icon={Users} chromeless justifyContent="flex-start">Đội bóng của tôi</Button>
                    <Button icon={Layout} chromeless justifyContent="flex-start">Đăng ký giải</Button>
                </>
            )}

            {/* Menu dành riêng cho ADMIN */}
            {role === 'ADMIN' && (
                <>
                    <Text color="$red10" fontSize="$2" paddingLeft="$3" marginTop="$4">HỆ THỐNG</Text>
                    <Button icon={Settings} chromeless justifyContent="flex-start">Quản lý User</Button>
                    <Button icon={Trophy} chromeless justifyContent="flex-start">Phê duyệt giải</Button>
                </>
            )}
        </YStack>
    )
}