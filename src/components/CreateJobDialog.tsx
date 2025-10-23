import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Minus, 
  Upload, 
  Link, 
  FileText, 
  Zap, 
  Bot,
  Info
} from 'lucide-react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';

interface DVMService {
  id: string;
  pubkey: string;
  name?: string;
  kinds: number[];
  categories?: string[];
}

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedService?: DVMService;
}

interface JobInput {
  type: 'text' | 'url' | 'event' | 'job';
  data: string;
  marker?: string;
}

interface JobParam {
  key: string;
  value: string;
}

const JOB_KINDS = [
  { value: 5000, label: 'Text Processing', description: 'General text processing and analysis' },
  { value: 5001, label: 'Image Generation', description: 'Generate images from text prompts' },
  { value: 5002, label: 'Image Enhancement', description: 'Enhance, upscale, or modify images' },
  { value: 5003, label: 'Speech to Text', description: 'Convert audio to text transcription' },
  { value: 5004, label: 'Text to Speech', description: 'Convert text to audio speech' },
  { value: 5005, label: 'Translation', description: 'Translate text between languages' },
  { value: 5006, label: 'Summarization', description: 'Summarize long text content' },
  { value: 5007, label: 'Content Moderation', description: 'Moderate content for safety' },
  { value: 5008, label: 'Sentiment Analysis', description: 'Analyze sentiment and emotions' },
  { value: 5009, label: 'OCR', description: 'Extract text from images' },
  { value: 5010, label: 'Video Processing', description: 'Process and analyze video content' },
  { value: 5011, label: 'Audio Processing', description: 'Process and analyze audio content' },
  { value: 5012, label: 'Code Analysis', description: 'Analyze and review code' },
  { value: 5013, label: 'Data Analysis', description: 'Analyze datasets and generate insights' },
  { value: 5014, label: 'AI Chat', description: 'Conversational AI assistance' },
  { value: 5015, label: 'Content Generation', description: 'Generate various types of content' },
];

const OUTPUT_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'application/pdf',
];

export function CreateJobDialog({ open, onOpenChange, preselectedService }: CreateJobDialogProps) {
  const [jobKind, setJobKind] = useState<number>(preselectedService?.kinds[0] || 5000);
  const [inputs, setInputs] = useState<JobInput[]>([{ type: 'text', data: '' }]);
  const [params, setParams] = useState<JobParam[]>([]);
  const [outputType, setOutputType] = useState('text/plain');
  const [maxBid, setMaxBid] = useState('');
  const [targetService, setTargetService] = useState(preselectedService?.pubkey || '');
  const [encryptParams, setEncryptParams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { toast } = useToast();

  const selectedJobType = JOB_KINDS.find(kind => kind.value === jobKind);

  const addInput = () => {
    setInputs([...inputs, { type: 'text', data: '' }]);
  };

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      setInputs(inputs.filter((_, i) => i !== index));
    }
  };

  const updateInput = (index: number, field: keyof JobInput, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setInputs(newInputs);
  };

  const addParam = () => {
    setParams([...params, { key: '', value: '' }]);
  };

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  const updateParam = (index: number, field: keyof JobParam, value: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);
  };

  const handleFileUpload = async (index: number, file: File) => {
    try {
      const tags = await uploadFile(file);
      const url = tags[0][1]; // First tag contains the URL
      updateInput(index, 'data', url);
      updateInput(index, 'type', 'url');
      toast({ title: 'File uploaded successfully' });
    } catch {
      toast({ 
        title: 'Upload failed', 
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const validateForm = () => {
    if (!user) {
      toast({ title: 'Please log in to create a job', variant: 'destructive' });
      return false;
    }

    if (inputs.some(input => !input.data.trim())) {
      toast({ title: 'Please fill in all input fields', variant: 'destructive' });
      return false;
    }

    if (params.some(param => !param.key.trim() || !param.value.trim())) {
      toast({ title: 'Please fill in all parameter fields or remove empty ones', variant: 'destructive' });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const tags: string[][] = [];

      // Add input tags
      inputs.forEach(input => {
        if (input.data.trim()) {
          tags.push(['i', input.data, input.type, '', input.marker || '']);
        }
      });

      // Add parameter tags
      params.forEach(param => {
        if (param.key.trim() && param.value.trim()) {
          tags.push(['param', param.key, param.value]);
        }
      });

      // Add output type
      if (outputType) {
        tags.push(['output', outputType]);
      }

      // Add bid amount
      if (maxBid && !isNaN(Number(maxBid))) {
        tags.push(['bid', (Number(maxBid) * 1000).toString()]); // Convert to millisats
      }

      // Add target service
      if (targetService) {
        tags.push(['p', targetService]);
      }

      // Add encryption marker if needed
      if (encryptParams && targetService) {
        tags.push(['encrypted']);
      }

      let content = '';
      
      // If encrypting params, encrypt the sensitive tags
      if (encryptParams && targetService && user?.signer.nip44) {
        const sensitiveData = {
          inputs: inputs.filter(input => input.data.trim()),
          params: params.filter(param => param.key.trim() && param.value.trim())
        };
        content = await user!.signer.nip44!.encrypt(targetService, JSON.stringify(sensitiveData));
        
        // Remove sensitive tags from the main tags array when encrypting
        const publicTags = tags.filter(tag => 
          !['i', 'param'].includes(tag[0])
        );
        tags.length = 0;
        tags.push(...publicTags);
      }

      await publishEvent({
        kind: jobKind,
        content,
        tags,
      });

      toast({ title: 'Job created successfully!' });
      onOpenChange(false);
      
      // Reset form
      setInputs([{ type: 'text', data: '' }]);
      setParams([]);
      setMaxBid('');
      setTargetService(preselectedService?.pubkey || '');
      setEncryptParams(false);
      
    } catch (error) {
      console.error('Failed to create job:', error);
      toast({ 
        title: 'Failed to create job', 
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>Create DVM Job</span>
          </DialogTitle>
          <DialogDescription>
            Create a new job request for Data Vending Machine services. Specify your requirements and let service providers compete to fulfill your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="job-kind" className="text-sm font-medium">
              Job Type
            </Label>
            <Select value={jobKind.toString()} onValueChange={(value) => setJobKind(Number(value))}>
              <SelectTrigger className="bg-background/50 border-primary/20">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent className="glass border-primary/20">
                {JOB_KINDS.map((kind) => (
                  <SelectItem key={kind.value} value={kind.value.toString()}>
                    <div className="space-y-1">
                      <div className="font-medium">{kind.label}</div>
                      <div className="text-xs text-muted-foreground">{kind.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedJobType && (
              <p className="text-sm text-muted-foreground">
                {selectedJobType.description}
              </p>
            )}
          </div>

          <Separator className="bg-primary/10" />

          <Tabs defaultValue="inputs" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 glass border-primary/20">
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="params">Parameters</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>

            {/* Inputs Tab */}
            <TabsContent value="inputs" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Job Inputs</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addInput}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Input
                  </Button>
                </div>
                
                {inputs.map((input, index) => (
                  <Card key={index} className="glass border-primary/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Input {index + 1}</Label>
                        {inputs.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeInput(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <Select 
                            value={input.type} 
                            onValueChange={(value) => updateInput(index, 'type', value as 'text' | 'url' | 'event' | 'job')}
                          >
                            <SelectTrigger className="bg-background/50 border-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-primary/20">
                              <SelectItem value="text">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4" />
                                  <span>Text</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="url">
                                <div className="flex items-center space-x-2">
                                  <Link className="h-4 w-4" />
                                  <span>URL</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="event">
                                <div className="flex items-center space-x-2">
                                  <Zap className="h-4 w-4" />
                                  <span>Nostr Event</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="job">
                                <div className="flex items-center space-x-2">
                                  <Bot className="h-4 w-4" />
                                  <span>Previous Job</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="md:col-span-2 space-y-2">
                          <Label className="text-xs text-muted-foreground">Data</Label>
                          <div className="flex space-x-2">
                            {input.type === 'text' ? (
                              <Textarea
                                value={input.data}
                                onChange={(e) => updateInput(index, 'data', e.target.value)}
                                placeholder="Enter your text input..."
                                className="bg-background/50 border-primary/20 resize-none"
                                rows={3}
                              />
                            ) : (
                              <Input
                                value={input.data}
                                onChange={(e) => updateInput(index, 'data', e.target.value)}
                                placeholder={
                                  input.type === 'url' ? 'https://example.com/file.jpg' :
                                  input.type === 'event' ? 'Event ID (hex)' :
                                  'Previous job event ID'
                                }
                                className="bg-background/50 border-primary/20"
                              />
                            )}
                            
                            {input.type === 'url' && (
                              <div className="relative">
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(index, file);
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="border-primary/20 hover:bg-primary/10"
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {(input.type === 'event' || input.type === 'job') && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Marker (optional)</Label>
                          <Input
                            value={input.marker || ''}
                            onChange={(e) => updateInput(index, 'marker', e.target.value)}
                            placeholder="Optional marker for this input"
                            className="bg-background/50 border-primary/20"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Parameters Tab */}
            <TabsContent value="params" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Job Parameters</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addParam}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>
                
                {params.length === 0 ? (
                  <Card className="border-dashed border-primary/20">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No parameters added. Parameters are optional and depend on the specific service requirements.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  params.map((param, index) => (
                    <Card key={index} className="glass border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Parameter {index + 1}</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeParam(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Key</Label>
                            <Input
                              value={param.key}
                              onChange={(e) => updateParam(index, 'key', e.target.value)}
                              placeholder="e.g., model, temperature, max_tokens"
                              className="bg-background/50 border-primary/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Value</Label>
                            <Input
                              value={param.value}
                              onChange={(e) => updateParam(index, 'value', e.target.value)}
                              placeholder="Parameter value"
                              className="bg-background/50 border-primary/20"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Output Tab */}
            <TabsContent value="output" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="output-type" className="text-sm font-medium">
                  Expected Output Format
                </Label>
                <Select value={outputType} onValueChange={setOutputType}>
                  <SelectTrigger className="bg-background/50 border-primary/20">
                    <SelectValue placeholder="Select output format" />
                  </SelectTrigger>
                  <SelectContent className="glass border-primary/20">
                    {OUTPUT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Specify the expected format for the job output. This helps service providers understand your requirements.
                </p>
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="max-bid" className="text-sm font-medium">
                    Maximum Bid (sats)
                  </Label>
                  <Input
                    id="max-bid"
                    type="number"
                    value={maxBid}
                    onChange={(e) => setMaxBid(e.target.value)}
                    placeholder="e.g., 1000"
                    className="bg-background/50 border-primary/20"
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional: Set the maximum amount you're willing to pay for this job in satoshis.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="target-service" className="text-sm font-medium">
                    Target Service (optional)
                  </Label>
                  <Input
                    id="target-service"
                    value={targetService}
                    onChange={(e) => setTargetService(e.target.value)}
                    placeholder="Service provider pubkey (hex)"
                    className="bg-background/50 border-primary/20"
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional: Specify a particular service provider's pubkey to target this job.
                  </p>
                </div>

                {targetService && user?.signer.nip44 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="encrypt-params"
                        checked={encryptParams}
                        onCheckedChange={setEncryptParams}
                      />
                      <Label htmlFor="encrypt-params" className="text-sm font-medium">
                        Encrypt sensitive parameters
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When enabled, input data and parameters will be encrypted for the target service provider only.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="bg-primary/10" />

          {/* Submit Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Job will be published to the current relay</span>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-primary/20 hover:bg-primary/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !user}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    Creating Job...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Job
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}