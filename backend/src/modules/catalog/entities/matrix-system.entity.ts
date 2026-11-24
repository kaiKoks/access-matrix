import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('matrix_systems')
export class MatrixSystemEntity {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  folderId!: string | null;

  @Column({ type: 'varchar', length: 64 })
  updatedAt!: string;

  @Column({ type: 'jsonb', nullable: true })
  sheets!: any[];
}
