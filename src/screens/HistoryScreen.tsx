import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useIoT } from '../context/IoTContext';
import { MessageItem } from '../components/MessageItem';
import { Card, EmptyState, PageHeading, styles as ui } from '../components/ui';
import { Icon } from '../components/Icon';
import { filterMessages } from '../utils/history';
import type { HistoryFilter } from '../utils/history';
const filters: HistoryFilter[] = ['Todas', 'Recebidas', 'Enviadas', 'Inválidas'];
export function HistoryScreen() {
  const { messages, palette, stats } = useIoT();
  const [filter, setFilter] = useState<HistoryFilter>('Todas');
  const [query, setQuery] = useState('');
  const visible = filterMessages(messages, filter, query);
  return <View style={{ gap: 20 }}>
    <PageHeading eyebrow="CADA TROCA, UM REGISTRO" title="Histórico" description="Acompanhe o caminho de cada mensagem." accessory={<View style={{ padding: 12, backgroundColor: palette.raised, borderRadius: 15 }}><Icon name="pulse" color={palette.accent} /></View>} />
    <Card style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-between' }}>
      {[{ label: 'Recebidas', value: stats.received, color: palette.humidity }, { label: 'Enviadas', value: stats.sent, color: palette.accent }, { label: 'Inválidas', value: stats.invalid, color: palette.danger }].map(item => <View key={item.label} style={{ flex: 1, gap: 7 }}><Text style={{ color: item.color, fontSize: 24, fontWeight: '700' }}>{item.value}</Text><Text style={{ color: palette.muted, fontSize: 11 }}>{item.label} na sessão</Text></View>)}
    </Card>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 15, paddingHorizontal: 14 }}>
      <Icon name="search" color={palette.muted} size={18} />
      <TextInput accessibilityLabel="Buscar mensagens" testID="history-search" placeholder="Buscar por tópico ou conteúdo" placeholderTextColor={palette.muted} value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} style={{ flex: 1, minWidth: 0, minHeight: 48, color: palette.text, fontSize: 13 }} />
      {query !== '' && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={12} onPress={() => setQuery('')}><Icon name="close" color={palette.muted} size={16} /></Pressable>}
    </View>
    <View style={[ui.row, { gap: 7 }]}>
      {filters.map(item => <Pressable key={item} testID={'filter-' + item} accessibilityRole="button" accessibilityLabel={'Filtrar ' + item} accessibilityState={{ selected: item === filter }} onPress={() => setFilter(item)}
        style={{ paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, backgroundColor: item === filter ? palette.accent : palette.raised }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: item === filter ? palette.onAccent : palette.muted }}>{item}</Text>
      </Pressable>)}
    </View>
    <View style={ui.between}><Text style={{ color: palette.muted, fontSize: 11 }}>{visible.length} de {messages.length} mensagens no histórico</Text><Text style={{ color: palette.muted, fontSize: 10 }}>Limite: 10 mais recentes</Text></View>
    {!visible.length ? <EmptyState icon={messages.length ? 'search' : 'pulse'} title={messages.length ? 'Nenhuma mensagem encontrada' : 'Sua atividade começa aqui'} description={messages.length ? 'Tente outro termo ou altere o filtro para ver mais resultados.' : 'Conecte seu ambiente e inicie o simulador. Cada leitura e comando aparecerá aqui automaticamente.'} />
      : visible.map(message => <MessageItem key={message.id} message={message} />)}
  </View>;
}
