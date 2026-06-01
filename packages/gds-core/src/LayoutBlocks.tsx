import { Alert, Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ActionBar } from './ActionBar';
import { GdsChart } from './GdsChart';
import { ListingCard } from './ListingCard';
import { SectionPanel } from './SectionPanel';

export type LayoutBlockType = 'hero' | 'stats' | 'cards-grid' | 'chart' | 'cta' | 'footer';

export interface LayoutBlock {
  id: string;
  type: LayoutBlockType;
  props: Record<string, unknown>;
}

export interface LayoutSchema {
  version: '1';
  blocks: LayoutBlock[];
}

function renderBlock(block: LayoutBlock) {
  switch (block.type) {
    case 'hero':
      return (
        <SectionPanel title={String(block.props.title ?? 'Hero')} description={String(block.props.description ?? 'Hero block')}>
          <Text>{String(block.props.body ?? 'Composable hero content')}</Text>
        </SectionPanel>
      );
    case 'stats':
      return (
        <SimpleGrid cols={{ base: 1, md: 3 }}>
          {(block.props.items as Array<{ label: string; value: string }> | undefined)?.map((item) => (
            <Card key={`${block.id}-${item.label}`} withBorder>
              <Stack gap={2}>
                <Text size="sm" c="dimmed">{item.label}</Text>
                <Title order={4}>{item.value}</Title>
              </Stack>
            </Card>
          )) ?? null}
        </SimpleGrid>
      );
    case 'cards-grid':
      return (
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          {(block.props.items as Array<{ title: string; description?: string }> | undefined)?.map((item) => (
            <ListingCard key={`${block.id}-${item.title}`} title={item.title} description={item.description} size="sm" />
          )) ?? null}
        </SimpleGrid>
      );
    case 'chart':
      return (
        <GdsChart
          type={(block.props.chartType as any) ?? 'bar'}
          title={String(block.props.title ?? 'Chart block')}
          summary={String(block.props.summary ?? 'Block-composed chart summary')}
          data={(block.props.data as Array<{ label: string; value: number }>) ?? [{ label: 'A', value: 10 }]}
        />
      );
    case 'cta':
      return (
        <ActionBar
          primary={{ action: 'save' }}
          secondary={[{ action: 'cancel' }]}
          tertiary={[{ action: 'preview' }]}
        />
      );
    case 'footer':
      return <Text size="sm" c="dimmed">{String(block.props.text ?? 'Footer block')}</Text>;
    default:
      return <Alert color="red">Unsupported block type.</Alert>;
  }
}

export function renderGdsLayout(schema: LayoutSchema) {
  return (
    <Stack gap="lg">
      {schema.blocks.map((block) => (
        <div key={block.id}>{renderBlock(block)}</div>
      ))}
    </Stack>
  );
}
